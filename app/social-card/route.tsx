import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig, siteSocialImage } from "../_lib/site-content";

const socialCardPalette = {
  background: "#171411",
  foreground: "#f7f2eb",
} as const;

const socialCardCacheSeconds = 31_536_000;
const socialCardFont = readFile(
  join(process.cwd(), "app/fonts/InterBold.ttf"),
);

export async function GET(request: Request) {
  const assetUrl = (pathname: string) => new URL(pathname, request.url).toString();
  const fontData = await socialCardFont;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: socialCardPalette.background,
          color: socialCardPalette.foreground,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Menimals Inter",
            fontSize: 112,
            fontWeight: 700,
            justifyContent: "center",
            left: 0,
            letterSpacing: -7,
            lineHeight: 1,
            position: "absolute",
            right: 0,
            top: 65,
          }}
        >
          {siteConfig.name.toLowerCase()}
        </div>
        <img
          alt=""
          src={assetUrl("/panda.png")}
          style={{
            bottom: -26,
            height: 390,
            left: 214,
            objectFit: "contain",
            position: "absolute",
            width: 390,
          }}
        />
        <img
          alt=""
          src={assetUrl("/kiwi.png")}
          style={{
            bottom: -50,
            height: 350,
            objectFit: "contain",
            position: "absolute",
            right: 202,
            transform: "rotate(90deg)",
            width: 350,
          }}
        />
        <img
          alt=""
          src={assetUrl("/pingwin.png")}
          style={{
            height: 340,
            left: 488,
            objectFit: "contain",
            position: "absolute",
            top: 220,
            transform: "rotate(180deg)",
            width: 340,
          }}
        />
      </div>
    ),
    {
      headers: {
        "Cache-Control": `public, max-age=${socialCardCacheSeconds}, immutable`,
      },
      fonts: [
        {
          data: fontData.buffer.slice(
            fontData.byteOffset,
            fontData.byteOffset + fontData.byteLength,
          ),
          name: "Menimals Inter",
          style: "normal",
          weight: 700,
        },
      ],
      height: siteSocialImage.height,
      width: siteSocialImage.width,
    },
  );
}
