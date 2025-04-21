# Milestone 5: Model Productionization  
**Course**: CSC 5382 - Spring 2025  
**Project**: Ingredient Substitution System  
**By**: Khadija Salih Alj  
**Supervisor**: Dr. Asmaa Mourhir  

---

## Overview

This milestone focuses on the **productionization of the Ingredient Substitution System**, transitioning it from a proof-of-concept to a scalable, production-ready AI system. The backend supports real-time substitution and recipe step rewriting via LLM inference, with CI/CD automation and deployment to the cloud.

A detailed report is available here:  
[`Milestone-5-Salih Alj.pdf`](./Milestone-5-Salih%20Alj.pdf)

---

##  I. ML System Architecture  
The system follows an enhanced MVC architecture integrating:

- **View**: React Native frontend  
- **Controller**: Node.js Express backend with two endpoints (`/substitute`, `/rewrite-step`)  
- **Model**: MongoDB database and in-memory cache  
- **External Services**: LLM inference via OpenRouter and CI/CD on Render  

Architecture diagram: [`architecture/laddaty_architecture_clean.pdf`](./architecture/laddaty_architecture_clean.pdf)

---

##  II. Application Development

###  Serving Mode Implementation  
- On-demand (real-time) machine-to-machine inference  
- Synchronous inference triggered by frontend interactions  

See details in the [report](./Milestone-5-Salih%20Alj.pdf#page=3)

###  Model Service Development  
- LLM-driven substitution + fuzzy matching + structured response  
- Custom prompts and JSON formatting
Code & prompts: [`model-service/`](./model-service)

###  Frontend Client Development  
- Integrated in the React Native app  
- API communication handled with loading feedback + fallbacks  
Related logic: [`frontend/`](./frontend)

---

##  III. Integration & Deployment

###  Packaging and Containerization  
- Lightweight Dockerfile using `node:18-alpine`  
Docker setup: [`docker/Dockerfile`](./docker/Dockerfile)

###  CI/CD Pipeline Integration  
- GitHub Actions triggered on push to `main`  
- Automatically builds and deploys to Render  
Workflow config: [`ci-cd/render-deploy.yml`](./ci-cd/render-deploy.yml)

###  Hosting the Application  
- Hosted on [Render](https://render.com) with custom domain  
- Domain: `https://api.laddaty.com`  
Screenshots: [`deployment/`](./deployment)

---

##  IV. Model Serving Runtime  
- OpenRouter’s GPT-4o as LLM runtime  
- Stateless, on-demand JSON response with error retries  
Prompt samples: [`model-service/`](./model-service)

---

##  Note

Due to the proprietary nature of the backend logic and API key security, only the high-level service design, prompts, architecture, and configuration details are shared. The full backend is deployed and accessible via:
👉 [`https://api.laddaty.com`](https://api.laddaty.com)
