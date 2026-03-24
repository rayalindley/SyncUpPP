import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN!);

async function test() {
  try {
    const res = await hf.models({
      model: "microsoft/phi-4"
    });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}

test();
