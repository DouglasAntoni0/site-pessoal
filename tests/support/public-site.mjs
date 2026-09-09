export const PUBLIC_SITE = 'https://douglasqa.netlify.app/';

export function publicSite() {
  const url = new URL(process.env.BASE_URL || PUBLIC_SITE);
  if (url.href !== PUBLIC_SITE) {
    throw new Error('Os testes devem usar exclusivamente ' + PUBLIC_SITE);
  }
  return PUBLIC_SITE;
}
