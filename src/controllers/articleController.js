import Article from '../models/Article.js';

const PAGE_SIZE = 20;
const articleController = {};

articleController.getArticles = async (req, res) => {
  try {
    const { page = 1, category, searchTitle } = req.query;

    const condition = {};
    if (category) condition.category = category;
    if (searchTitle) {
      condition.title = { $regex: searchTitle, $options: 'i' };
    }

    const skip = (page - 1) * PAGE_SIZE;

    const [articles, totalArticleNum] = await Promise.all([
      Article.find(condition)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .exec(),
      Article.countDocuments(condition),
    ]);

    const totalPageNum = Math.ceil(totalArticleNum / PAGE_SIZE);
    res.status(200).json({
      status: 'success',
      articles,
      totalPageNum,
    });
  } catch (err) {
    res.status(500).json({ status: 'Failed', error: err.message });
  }
};

articleController.updateArticleView = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);
    article.views += 1;

    await article.save();
    res.status(200).json({ status: 'success', article });
  } catch (err) {
    res.status(400).json({ status: 'Failed', error: err.message });
  }
};

export default articleController;
