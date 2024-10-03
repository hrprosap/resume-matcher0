import { parseCookies } from 'nookies';

export default async function handler(req, res) {
  const cookies = parseCookies({ req });
  const isAuthenticated = !!cookies.access_token;
  res.status(200).json({ isAuthenticated });
}
