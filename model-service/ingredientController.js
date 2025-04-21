const { getSubstitutes, updateStepForSubstitution } = require('../services/ingredientService');

const getSubstitution = async (req, res) => {
    const { ingredient, recipe } = req.query;
    if (!ingredient) return res.status(400).json({ error: "Ingredient is required" });

    try {
        const data = await getSubstitutes(ingredient, recipe);
        res.json({ ingredient, substitutes: data.substitutes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateStepsWithSubstitution = async (req, res) => {
    const { steps, original, substitute } = req.body;
    console.log(steps, original, substitute)
    if (!steps || !Array.isArray(steps) || !original || !substitute) {
        return res.status(400).json({ error: "Steps, original, and substitute are required." });
    }
    try {
        const updatedSteps = [];

        for (const step of steps) {
            const updatedText = await updateStepForSubstitution(step.description, original, substitute);
            updatedSteps.push({ index: step.index, description: updatedText });
        }
        console.log(updatedSteps)
        res.json({ updatedSteps });
    } catch (error) {
        console.error("Failed to update steps:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getSubstitution, updateStepsWithSubstitution };
