// Vercel Serverless Function to securely serve TMDB credentials from Vercel Environment Variables
module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');

    res.status(200).json({
        TMDB_API_KEY: process.env.TMDB_API_KEY || '',
        TMDB_READ_ACCESS_TOKEN: process.env.TMDB_READ_ACCESS_TOKEN || ''
    });
};
