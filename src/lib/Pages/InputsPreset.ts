type InputType = {
  name: string;
  label: string;
  type: "text" | "select" | "range" | "textarea";
  value: string | number;
  placeholder?: string;
  required?: boolean;
  options?:
    | { value: string; label: string }[]
    | { value: string; label: string }[];
  step?: number;
  min?: number;
  max?: number;
};

const lmSettings: InputType[] = [
  {
    name: "temperature",
    label: "Temperature:",
    type: "range",
    value: 1,
    step: 0.1,
    min: 0,
    max: 2,
  },
  {
    name: "topK",
    label: "Top K:",
    type: "range",
    value: 3,
    step: 1,
    min: 1,
    max: 8,
  },
];

const lmInputs: InputType[] = [
  {
    name: "lm-text",
    label: "Message:",
    type: "textarea",
    value: "",
    placeholder: "Enter message...",
    required: false,
  },
];

const summarizerSettings: InputType[] = [
  {
    name: "sharedContext",
    label: "Shared Context:",
    type: "text",
    value: "",
    placeholder: "Enter shared context...",
    required: false,
  },
  {
    name: "type",
    label: "Type:",
    type: "select",
    value: "key-points",
    options: [
      { value: "key-points", label: "Key Points" },
      { value: "tldr", label: "TL;DR" },
      { value: "teaser", label: "Teaser" },
      { value: "headline", label: "Headline" },
    ],
  },
  {
    name: "format",
    label: "Format:",
    type: "select",
    value: "plain-text",
    options: [
      { value: "plain-text", label: "Plain Text" },
      { value: "markdown", label: "Markdown" },
    ],
  },
  {
    name: "length",
    label: "Length:",
    type: "select",
    value: "short",
    options: [
      { value: "short", label: "Short" },
      { value: "medium", label: "Medium" },
      { value: "long", label: "Long" },
    ],
  },
];

const summarizerInputs: InputType[] = [
  {
    name: "context",
    label: "Context:",
    type: "text",
    value: "",
    placeholder: "Enter context...",
    required: false,
  },
  {
    name: "summarizer-text",
    label: "Text to summarize:",
    type: "textarea",
    value: "",
    placeholder: "Enter text to summarize...",
    required: true,
  },
];

const detectorSettings: InputType[] = [];

const detectorInputs: InputType[] = [
  {
    name: "detector-text",
    label: "Text to detect:",
    type: "textarea",
    value: "",
    placeholder: "Enter text to detect language...",
    required: true,
  },
];

const languages = [
  { value: "en", label: "English" },
  { value: "it", label: "Italian" },
];

const translatorSettings: InputType[] = [
  {
    name: "sourceLanguage",
    label: "Source:",
    type: "select",
    value: "auto",
    options: [{ value: "auto", label: "Auto Detect" }, ...languages],
  },
  {
    name: "targetLanguage",
    label: "Target:",
    type: "select",
    value: "en",
    options: [{ value: "auto", label: "System Language (Auto)" }, ...languages],
  },
];

const translatorInputs: InputType[] = [
  {
    name: "translator-text",
    label: "Text to translate:",
    type: "textarea",
    value: "",
    placeholder: "Enter text to translate...",
    required: true,
  },
];

const writerSettings: InputType[] = [
  {
    name: "sharedContext",
    label: "Shared Context:",
    type: "text",
    value: "",
    placeholder: "Enter shared context...",
    required: false,
  },
  {
    name: "tone",
    label: "Tone:",
    type: "select",
    value: "neutral",
    options: [
      { value: "formal", label: "Formal" },
      { value: "neutral", label: "Neutral" },
      { value: "casual", label: "Casual" },
    ],
  },
  {
    name: "length",
    label: "Length:",
    type: "select",
    value: "short",
    options: [
      { value: "short", label: "Short" },
      { value: "medium", label: "Medium" },
      { value: "long", label: "Long" },
    ],
  },
  {
    name: "format",
    label: "Format:",
    type: "select",
    value: "plain-text",
    options: [
      { value: "plain-text", label: "Plain Text" },
      { value: "markdown", label: "Markdown" },
    ],
  },
];

const writerInputs: InputType[] = [
  {
    name: "writer-text",
    label: "Text to write:",
    type: "textarea",
    value: "",
    placeholder: "Enter text to write...",
    required: true,
  },
];

const rewriterSettings: InputType[] = [
  {
    name: "sharedContext",
    label: "Shared Context:",
    type: "text",
    value: "",
    placeholder: "Enter shared context...",
    required: false,
  },
  {
    name: "tone",
    label: "Tone:",
    type: "select",
    value: "as-is",
    options: [
      { value: "as-is", label: "As Is" },
      { value: "more-formal", label: "More Formal" },
      { value: "more-casual", label: "More Casual" },
    ],
  },
  {
    name: "length",
    label: "Length:",
    type: "select",
    value: "as-is",
    options: [
      { value: "as-is", label: "As Is" },
      { value: "shorter", label: "Shorter" },
      { value: "longer", label: "Longer" },
    ],
  },
  {
    name: "format",
    label: "Format:",
    type: "select",
    value: "plain-text",
    options: [
      { value: "as-is", label: "As Is" },
      { value: "plain-text", label: "Plain Text" },
      { value: "markdown", label: "Markdown" },
    ],
  },
];

const rewriterInputs: InputType[] = [
  {
    name: "rewriter-text",
    label: "Text to rewrite:",
    type: "textarea",
    value: "",
    placeholder: "Enter text to rewrite...",
    required: true,
  },
];

export const nameToInputs: { [key: string]: InputType[] } = {
  lm: lmInputs,
  summarizer: summarizerInputs,
  detector: detectorInputs,
  translator: translatorInputs,
  writer: writerInputs,
  rewriter: rewriterInputs,
};

export const nameToSettings = {
  lm: lmSettings,
  summarizer: summarizerSettings,
  detector: detectorSettings,
  translator: translatorSettings,
  writer: writerSettings,
  rewriter: rewriterSettings,
};
