const axios = require('axios');
const stringSimilarity = require('string-similarity');
const Ingredient = require('../models/Ingredient');
const apiKey = process.env.API_KEY;

let ingredientNames = [];
let ingredientData = {};
let isIngredientsLoaded = false;

async function loadIngredients() {
    if (!isIngredientsLoaded) {
        const ingredients = await Ingredient.find({}, { name: 1, image: 1, nutrition: 1 }).lean();
        ingredientNames = ingredients.map(doc => doc.name.toLowerCase());
        ingredientData = ingredients.reduce((acc, doc) => {
            acc[doc.name.toLowerCase()] = {
                image: doc.image,
                nutrition: doc.nutrition || {},
            };
            return acc;
        }, {});
        isIngredientsLoaded = true;
    }
}

function findClosestMatch(ingredient) {
    if (!ingredient || typeof ingredient !== "string") return null;
    const match = stringSimilarity.findBestMatch(ingredient.toLowerCase(), ingredientNames);
    return match?.bestMatch?.rating > 0.77 ? match.bestMatch.target : null;
}

function removeParentheses(text) {
    return text.replace(/\s*\(.*?\)\s*/g, '').trim();
}

function getIngredientData(ingredient) {
    return ingredientData[ingredient.toLowerCase()] || { image: null, nutrition: {} };
}

async function updateStepForSubstitution(originalStep, originalIng, substituteIng) {
    const prompt = `
        You are rewriting a cooking instruction step for a recipe.

        Original step:
        "${originalStep}"

        The ingredient "${originalIng}" has been replaced with "${substituteIng}".

        Your task:
        - Rewrite the step so it makes sense with the new ingredient.
        - Make sure the action (like melt, chop, blend...) suits the substitute.
        - Keep it short and natural.
        - Do NOT mention "${originalIng}" at all.

        Return ONLY a JSON object like this:
        {
        "title": "Short step title (action-based)",
        "description": "Rewritten step using the substitute ingredient"
        }
        Make sure it's valid JSON. No explanation, no formatting, no notes.
    `;

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/chatgpt-4o-latest",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let content = response.data?.choices?.[0]?.message?.content?.trim();
        if (!content) return { title: "", description: originalStep };

        // Try parsing JSON
        try {
            const parsed = JSON.parse(content);
            return {
                title: parsed.title?.trim() || "",
                description: parsed.description?.trim() || originalStep
            };
        } catch (jsonErr) {
            console.warn("⚠️ Fallback: Could not parse JSON. Raw content:", content);

            // Attempt extracting manually if JSON failed
            const titleMatch = content.match(/"title"\s*:\s*"(.*?)"/);
            const descMatch = content.match(/"description"\s*:\s*"(.*?)"/);

            return {
                title: titleMatch?.[1]?.trim() || "",
                description: descMatch?.[1]?.trim() || originalStep
            };
        }
    } catch (err) {
        console.error("❌ Error rewriting step:", err.message);
        return { title: "", description: originalStep };
    }
}

async function matchSubstitutes(aiSubstitutes) {
    const matched = new Set();
    for (const sub of aiSubstitutes) {
        const closestMatch = findClosestMatch(sub);
        if (closestMatch && !matched.has(closestMatch)) matched.add(closestMatch);
    }
    return [...matched].slice(0, 10);
}

async function generateSubstitute(ingredient, recipe) {
    const prompt =
        `Suggest the best 10 substitutes for "${ingredient}" in this recipe "${recipe}".
        For each substitute, provide:
        1. Ensure that the ratio provided can logically be applied **in both directions**.
        Provide the response in strict JSON format with:
        {
            "substitutes": [
                {"name": "Substitute Name", "ratio": "Substitution ratio as a decimal number"}
            ]
        }`;
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: "openai/chatgpt-4o-latest",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const rawContent = response.data?.choices?.[0]?.message?.content;
            if (!rawContent) throw new Error("No content in response");
            let content;
            try {
                content = JSON.parse(rawContent);
            } catch (e) {
                const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Invalid JSON format in model response");
                try {
                    content = JSON.parse(jsonMatch[0]);
                } catch (jsonErr) {
                    console.error("JSON parsing failed:", jsonMatch[0]);
                    throw new Error("Failed to parse JSON from matched block");
                }
            }
            console.log(content)
            return (content.substitutes || [])
                .filter(s => s.name && s.ratio)
                .map(s => ({
                    name: s.name.trim(),
                    ratio: parseFloat(s.ratio.toString().match(/[\d.]+/g)?.[0])
                }))
                .filter(s => s.ratio);

        } catch (error) {
            retryCount++;
            console.error(`Retry ${retryCount}:`, error.message);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    return [];
}

async function getSubstitutes(ingredient, recipe) {
    await loadIngredients();
    const closestMatch = findClosestMatch(ingredient);
    if (!closestMatch) return { ingredient: null, substitutes: [] };

    const doc = await Ingredient.findOne({ name: closestMatch }, { substitutes: 1 }).lean();
    const substitutes = doc?.substitutes || [];

    if (substitutes.length > 0) {
        return {
            ingredient: closestMatch,
            substitutes: substitutes.slice(0, 10).map(sub => ({
                name: sub,
                ...getIngredientData(sub),
            })),
        };
    }

    const aiSubstitutes = await generateSubstitute(closestMatch, recipe);
    const cleanedNames = aiSubstitutes.map(s => removeParentheses(s.name));
    const matched = await matchSubstitutes(cleanedNames);
    const ratioMap = Object.fromEntries(
        aiSubstitutes.map(s => [removeParentheses(s.name).toLowerCase(), s.ratio])
    );

    const filtered = matched.filter(name =>
        name.toLowerCase() !== closestMatch.toLowerCase()
    );

    return {
        ingredient: closestMatch,
        substitutes: filtered.map(name => ({
            name,
            quantity: ratioMap[name.toLowerCase()],
            ...getIngredientData(name),
        }))
    };

}

module.exports = { getSubstitutes, updateStepForSubstitution };
