import ImageKit from "imagekit";

export const imagekit = new ImageKit({
  publicKey: (process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "").replace(/"/g, '').trim(),
  privateKey: (process.env.IMAGEKIT_PRIVATE_KEY || "").replace(/"/g, '').trim(),
  urlEndpoint: (process.env.IMAGEKIT_URL || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "").replace(/"/g, '').trim(),
});
