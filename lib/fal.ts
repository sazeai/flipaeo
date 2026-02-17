import { fal } from "@fal-ai/client";

export async function generateImage(prompt: string) {
  const result = await fal.subscribe("fal-ai/flux-2/turbo", {
    input: {
      prompt,
      guidance_scale: 10,
      image_size: {
        width: 1200,
        height: 800
      },
      num_images: 1,
      enable_safety_checker: true,
      output_format: "webp"
    },
    logs: true,
  });

  return result.data;
}
