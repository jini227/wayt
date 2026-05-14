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

const addressBookScreenPath = path.resolve(__dirname, "../../app/address-book.tsx");
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

function Icon() {
  return null;
}

const addressBookState = [
  [],
  false,
  false,
  "",
  ""
];
let stateIndex = 0;

Module._load = function loadWithAddressBookScreenStubs(request, parent, isMain) {
  if (request === "react" && parent?.filename === addressBookScreenPath) {
    return {
      useCallback: (callback) => callback,
      useEffect: () => undefined,
      useMemo: (factory) => factory(),
      useState: (initialValue) => {
        const mockedValue = addressBookState[stateIndex++];
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
      Pressable: "Pressable",
      StyleSheet: { create: (styles) => styles },
      Text: "Text",
      TextInput: "TextInput",
      View: "View"
    };
  }

  if (request === "expo-router") {
    return {
      useRouter: () => ({ back: () => undefined })
    };
  }

  if (request === "lucide-react-native") {
    return new Proxy({}, { get: () => Icon });
  }

  if (request === "../src/components/AppScreen") {
    return { AppScreen };
  }

  if (request === "../src/components/Avatar") {
    return { Avatar };
  }

  if (request === "../src/components/Cards") {
    return { Header, InfoCard };
  }

  if (request === "../src/api/client") {
    return {
      apiDeleteAuthenticated: async () => undefined,
      apiGetAuthenticated: async () => [],
      apiPostAuthenticated: async () => ({})
    };
  }

  if (request === "../src/feedback/AppFeedback") {
    return { useAppFeedback: () => ({ showDialog: () => undefined, showToast: () => undefined }) };
  }

  return originalLoad.apply(this, arguments);
};

const AddressBookScreen = require(addressBookScreenPath).default;
const element = AddressBookScreen();

const quickInviteInputBox = collectElements(element, "View").find((node) => {
  const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
  return children.some((child) => isElement(child) && child.type === "TextInput");
});
const quickInviteInput = collectElements(quickInviteInputBox, "TextInput")[0];

assert.equal(quickInviteInputBox.props.style.minWidth, 0, "quick invite input box can shrink beside the add button");
assert.equal(quickInviteInput.props.style.minWidth, 0, "quick invite text input does not overflow its row when focused");

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

function isElement(value) {
  return value !== null && typeof value === "object" && "type" in value && "props" in value;
}
