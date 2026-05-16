process.env.TS_NODE_SKIP_PROJECT = "true";
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "CommonJS",
  moduleResolution: "Node",
  jsx: "react-jsx"
});

require("ts-node/register/transpile-only");

const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("module");

const inviteScreenPath = path.resolve(__dirname, "../../app/appointments/[id]/invite.tsx");
const originalLoad = Module._load;

function AppScreen() {
  return null;
}

function Header() {
  return null;
}

function InfoCard() {
  return null;
}

function Avatar() {
  return null;
}

function FooterBar() {
  return null;
}

function PrimaryButton() {
  return null;
}

function ParticipantRow() {
  return null;
}

function Icon() {
  return null;
}

const inviteScreenState = [
  { id: "appointment-1", title: "Dinner", participants: [] },
  false,
  null,
  false,
  "",
  false,
  [],
  new Set(),
  [],
  false,
  false,
  false,
  "",
  false,
  new Set(),
  false,
  [],
  []
];
let stateIndex = 0;

Module._load = function loadWithInviteScreenStubs(request, parent, isMain) {
  if (request === "react" && parent?.filename === inviteScreenPath) {
    return {
      useCallback: (callback) => callback,
      useEffect: () => undefined,
      useMemo: (factory) => factory(),
      useRef: (value) => ({ current: value }),
      useState: (initialValue) => {
        const mockedValue = inviteScreenState[stateIndex++];
        return [
          mockedValue === undefined ? (typeof initialValue === "function" ? initialValue() : initialValue) : mockedValue,
          () => undefined
        ];
      }
    };
  }

  if (request === "react-native") {
    return {
      ActivityIndicator: "ActivityIndicator",
      Platform: { OS: "web" },
      Pressable: "Pressable",
      Share: { share: async () => undefined },
      StyleSheet: { create: (styles) => styles },
      Text: "Text",
      TextInput: "TextInput",
      View: "View"
    };
  }

  if (request === "expo-clipboard") {
    return { setStringAsync: async () => undefined };
  }

  if (request === "expo-router") {
    return {
      useLocalSearchParams: () => ({ id: "appointment-1" }),
      useRouter: () => ({ back: () => undefined })
    };
  }

  if (request === "lucide-react-native") {
    return new Proxy({}, { get: () => Icon });
  }

  if (request === "../../../src/components/AppScreen") {
    return { AppScreen };
  }

  if (request === "../../../src/components/Avatar") {
    return { Avatar };
  }

  if (request === "../../../src/components/Cards") {
    return { Header, InfoCard };
  }

  if (request === "../../../src/components/FooterBar") {
    return { FooterBar };
  }

  if (request === "../../../src/components/Buttons") {
    return { PrimaryButton };
  }

  if (request === "../../../src/components/ParticipantRow") {
    return { ParticipantRow };
  }

  if (request === "../../../src/api/client") {
    return {
      apiGetAuthenticated: async () => [],
      apiPostAuthenticated: async () => ({})
    };
  }

  if (request === "../../../src/auth/AuthContext") {
    return { useAuth: () => ({ user: { id: "user-me", waytId: "@me" } }) };
  }

  if (request === "../../../src/config/env") {
    return { env: { kakaoJavascriptKey: "test-key" } };
  }

  if (request === "../../../src/feedback/AppFeedback") {
    return { useAppFeedback: () => ({ showDialog: () => undefined, showToast: () => undefined }) };
  }

  return originalLoad.apply(this, arguments);
};

const InviteScreen = require(inviteScreenPath).default;
const element = InviteScreen();

assert.equal(element.props.keyboardAvoiding, true, "invite screen avoids the iOS keyboard");
assert.equal(element.props.keyboardShouldPersistTaps, "handled", "invite screen keeps taps usable while the keyboard is open");

const infoCards = collectElements(element, InfoCard);

assert.equal(infoCards.length, 3, "invite screen shows the current participants, Wayt ID invite, and link invite cards");
assert.equal(
  containsElementType(infoCards[1], "TextInput"),
  true,
  "Wayt ID invite card appears before the link invite card"
);

function collectElements(node, type) {
  if (!isElement(node)) {
    if (Array.isArray(node)) {
      return node.flatMap((child) => collectElements(child, type));
    }
    return [];
  }

  return [
    ...(node.type === type ? [node] : []),
    ...collectElements(node.props?.children, type)
  ];
}

function containsElementType(node, type) {
  if (!isElement(node)) {
    return Array.isArray(node) && node.some((child) => containsElementType(child, type));
  }

  return node.type === type || containsElementType(node.props?.children, type);
}

function isElement(value) {
  return value !== null && typeof value === "object" && "type" in value && "props" in value;
}
