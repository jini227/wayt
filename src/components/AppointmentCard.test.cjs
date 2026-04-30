process.env.TS_NODE_SKIP_PROJECT = "true";
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "CommonJS",
  moduleResolution: "Node",
  jsx: "react-jsx"
});

require("ts-node/register/transpile-only");

const Module = require("module");
const originalLoad = Module._load;

function Icon() {
  return null;
}

Module._load = function loadWithReactNativeStubs(request, parent, isMain) {
  if (request === "react-native") {
    return {
      Pressable: "Pressable",
      StyleSheet: { create: (styles) => styles },
      Text: "Text",
      View: "View"
    };
  }

  if (request === "lucide-react-native") {
    return {
      CalendarDays: Icon,
      CheckCircle2: Icon,
      ChevronRight: Icon,
      Clock3: Icon,
      Gift: Icon,
      Home: Icon,
      LockKeyhole: Icon,
      LockKeyholeOpen: Icon,
      MapPin: Icon,
      UserRound: Icon
    };
  }

  if (parent?.filename?.endsWith("AppointmentCard.tsx") && request === "./Avatar") {
    return {
      Avatar: function Avatar() {
        return null;
      }
    };
  }

  return originalLoad.apply(this, arguments);
};

const { AppointmentCard } = require("./AppointmentCard.tsx");

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function collectTextChildren(node, insideText = false) {
  if (node == null || typeof node === "boolean") {
    return [];
  }
  if (typeof node === "string" || typeof node === "number") {
    return insideText ? [String(node)] : [];
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectTextChildren(child, insideText));
  }

  const nextInsideText = insideText || node.type === "Text";
  return collectTextChildren(node.props?.children, nextInsideText);
}

function appointment(role) {
  return {
    id: `appointment-${role}`,
    title: "Dinner",
    role,
    timeLabel: "오늘 오후 7:00",
    place: "Hongdae",
    shareStart: "위치 공개 중",
    peopleCount: 2
  };
}

const participantTexts = collectTextChildren(AppointmentCard({ appointment: appointment("참가자") }));
assertEqual(participantTexts.includes("참가자"), false, "participant cards do not render a role mark");

const hostTexts = collectTextChildren(AppointmentCard({ appointment: appointment("방장") }));
assertEqual(hostTexts.includes("방장"), true, "host cards render the host mark");
