import type { ImgHTMLAttributes } from "react";
import { SIZES, srcSetFor, type ImageKind } from "@/lib/imageSizes";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes"> {
  src: string;
  /** Which variant set the file has: generated photos or ingredient art. */
  kind?: ImageKind;
  /** A preset slot name or a literal `sizes` string. */
  sizes: keyof typeof SIZES | (string & {});
}

/**
 * Responsive <img> for generated pictures. Every generated file is stored
 * with narrower variants, so the browser downloads the smallest one that
 * fills the slot (a 44px ingredient tile never pulls a 1024px file).
 */
export function Pic({ src, kind = "photo", sizes, alt = "", loading = "lazy", decoding = "async", ...rest }: Props) {
  const resolvedSizes = sizes in SIZES ? SIZES[sizes as keyof typeof SIZES] : sizes;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} srcSet={srcSetFor(src, kind)} sizes={resolvedSizes} alt={alt} loading={loading} decoding={decoding} {...rest} />;
}
