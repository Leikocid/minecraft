// A shipped .lang file imported `with { type: "text" }`: esbuild inlines its text into the GameTest bundle.
declare module "*.lang" {
  const text: string;
  export default text;
}
