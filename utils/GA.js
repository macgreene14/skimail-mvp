import Script from "next/script";

export default function GA() {
  const NEXT_PUBLIC_GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${NEXT_PUBLIC_GA_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${NEXT_PUBLIC_GA_ID}', {
            page_path: window.location.pathname,
          });
        `,
        }}
      />
    </>
  );
}
