import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';
import type { Project, AnalysisResult } from '../types';

// Initialize OpenAI with better error handling
let openai: OpenAI | null = null;
try {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (apiKey) {
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

export class ProjectAnalyzer {
  static async scrapeProjects(): Promise<Project[]> {
    try {
      const response = await axios.get('https://ied.eu/eu-programmes/ied-projects/');
      const $ = cheerio.load(response.data);
      const projects: Project[] = [];

      // Extract project information from the webpage
      $('.project-item').each((_, element) => {
        const name = $(element).find('.project-title').text().trim();
        const description = $(element).find('.project-description').text().trim();
        const url = $(element).find('a').attr('href') || '';

        projects.push({
          id: crypto.randomUUID(),
          name,
          description,
          url,
          category: 'unsuitable', // Default category before analysis
        });
      });

      return projects;
    } catch (error) {
      console.error('Error scraping projects:', error);
      return [];
    }
  }

  static async analyzeProject(project: Project): Promise<AnalysisResult> {
    if (!openai) {
      throw new Error('OpenAI API key is not configured. Please add your API key to the .env file as VITE_OPENAI_API_KEY.');
    }

    try {
      const prompt = `
        Analyze this EU project for educational potential:
        Name: ${project.name}
        Description: ${project.description}
        
        Please evaluate:
        1. Suitability for educational use (score 0-100)
        2. Target audience (school/adult/both)
        3. Create a detailed educational implementation plan
        4. Provide specific recommendations for implementation
        
        Format the response as JSON with the following structure:
        {
          "suitabilityScore": number,
          "category": "school" | "adult" | "both" | "unsuitable",
          "educationalPlan": "detailed plan...",
          "recommendations": ["rec1", "rec2", ...]
        }
      `;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4-turbo-preview",
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content || '{}') as AnalysisResult;
    } catch (error) {
      console.error('Error analyzing project:', error);
      return {
        suitabilityScore: 0,
        category: 'unsuitable',
        educationalPlan: error instanceof Error ? error.message : 'Analysis failed',
        recommendations: []
      };
    }
  }

  static async findOfficialWebsite(projectName: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(projectName + ' official website EU project')}&format=json`
      );
      return response.data.AbstractURL || '';
    } catch (error) {
      console.error('Error finding official website:', error);
      return '';
    }
  }
}