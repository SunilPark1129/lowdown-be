import dotenv from 'dotenv';
import axios from 'axios';
import Article from '../models/Article.js';
import { NEWS_DOMAINS } from '../utils/domains.js';
dotenv.config();

const API_KEY = process.env.NEWS_API_KEY;
const URL = 'https://newsapi.org/v2/everything';

const getISODate = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const newsScheduler = async () => {
  const categoryList = [
    'business',
    'entertainment',
    'general',
    'health',
    'science',
    'sports',
    'technology',
  ];
  const from = getISODate(2);
  const to = getISODate();

  try {
    const articleCount = await Article.countDocuments();
    if (articleCount > 1000) return;

    await Promise.all(
      categoryList.map(async (category) => {
        const existingArticles = await Article.find(
          { category },
          { title: 1, _id: 0 }
        );
        const existingTitlesSet = new Set(
          existingArticles.map((article) => article.title.toLowerCase())
        );

        const response = await axios.get(URL, {
          params: {
            apiKey: API_KEY,
            q: category,
            domains: NEWS_DOMAINS,
            from,
            to,
            sortBy: 'relevancy',
          },
        });

        const filteredArticles = response.data.articles.filter(
          (article) => !existingTitlesSet.has(article.title.toLowerCase())
        );

        if (filteredArticles.length > 0) {
          await Article.insertMany(
            filteredArticles.map((article) => ({
              source: article.source,
              title: article.title,
              content: article.content,
              summary: article.description,
              deleteFlag: true,
              publishedAt: article.publishedAt,
              category,
              url: article.url,
              urlToImage: article.urlToImage,
              comments: [],
            }))
          );
        }
      })
    );

    console.log('News scheduling completed successfully.');
  } catch (error) {
    console.error('Error during news scheduling:', error);
  }
};
