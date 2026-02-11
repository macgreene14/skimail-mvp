// Webcam registry - maps resort slugs to webcam data
// camPageUrl: link to resort's official webcam page
// imageUrl: static JPEG that refreshes (can be used as <img src>) - when available
// youtubeEmbed: YouTube live stream embed URL - when available
//
// NOTE: imageUrl and youtubeEmbed entries could not be reliably verified via automated
// scraping (most resort sites block bots / use JS rendering). All camPageUrl entries
// point to the official resort webcam pages and should be stable.

const WEBCAM_REGISTRY = {
  "vail": {
    camPageUrl: "https://www.vail.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "breckenridge": {
    camPageUrl: "https://www.breckenridge.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "park_city": {
    camPageUrl: "https://www.parkcitymountain.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "mammoth": {
    camPageUrl: "https://www.mammothmountain.com/mountain-information/mountain-cams",
  },
  "jackson_hole": {
    camPageUrl: "https://www.jacksonhole.com/mountain-cams",
  },
  "big_sky": {
    camPageUrl: "https://www.bigskyresort.com/the-mountain/mountain-cams",
  },
  "steamboat": {
    camPageUrl: "https://www.steamboat.com/the-mountain/mountain-cams",
  },
  "aspen_mountain": {
    camPageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams",
  },
  "aspen_highlands": {
    camPageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams",
  },
  "whistler": {
    camPageUrl: "https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "telluride": {
    camPageUrl: "https://www.tellurideskiresort.com/the-mountain/webcams/",
  },
  "deer_valley": {
    camPageUrl: "https://www.deervalley.com/mountain/conditions/webcams",
  },
  "alta": {
    camPageUrl: "https://www.alta.com/conditions/webcams",
  },
  "snowbird": {
    camPageUrl: "https://www.snowbird.com/mountain-report/#webcams",
  },
  "stowe": {
    camPageUrl: "https://www.stowe.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "killington": {
    camPageUrl: "https://www.killington.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "heavenly": {
    camPageUrl: "https://www.skiheavenly.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "northstar": {
    camPageUrl: "https://www.northstarcalifornia.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "kirkwood": {
    camPageUrl: "https://www.kirkwood.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "palisades_tahoe": {
    camPageUrl: "https://www.palisadestahoe.com/mountain-information/mountain-cams",
  },
  "sun_valley": {
    camPageUrl: "https://www.sunvalley.com/mountain-info/webcams",
  },
  "copper_mountain": {
    camPageUrl: "https://www.coppercolorado.com/the-mountain/conditions-weather/webcams",
  },
  "winter_park": {
    camPageUrl: "https://www.winterparkresort.com/the-mountain/mountain-conditions/mountain-cams",
  },
  "keystone": {
    camPageUrl: "https://www.keystoneresort.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "crested_butte": {
    camPageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  },
  "chamonix": {
    camPageUrl: "https://www.chamonix.com/webcams",
  },
  "zermatt": {
    camPageUrl: "https://www.zermatt.ch/en/webcams",
  },
  "niseko_united": {
    camPageUrl: "https://www.niseko.ne.jp/en/niseko-live-camera/",
  },
  "hakuba_happo-one": {
    camPageUrl: "https://www.happo-one.jp/english/mountain/livecamera",
  },
  "hakuba_47": {
    camPageUrl: "https://www.hakuba47.co.jp/winter/english/",
  },
  "hakuba_cortina": {
    camPageUrl: "https://www.hotelamigonet.com/en/",
  },
  "hakuba_iwatake": {
    camPageUrl: "https://iwatake-mountain-resort.com/en/winter",
  },
  "hakuba_norikura_": {
    camPageUrl: "https://www.hakubagoryu.com/winter/en/",
  },
  "able_hakuba_goryu": {
    camPageUrl: "https://www.hakubagoryu.com/winter/en/",
  },
};

export default WEBCAM_REGISTRY;

export function getWebcam(slug) {
  return WEBCAM_REGISTRY[slug] || null;
}
