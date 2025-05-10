module.exports = (req, res) => {
  const { CLIENT_ID, REDIRECT_URI } = process.env;

  const installUrl = `https://app.gohighlevel.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`<a href="${installUrl}">Install WellnessLiving Connect</a>`);
};
