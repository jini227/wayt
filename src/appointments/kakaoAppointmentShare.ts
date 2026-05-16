import { createAppointmentShareMessage } from "./appointmentShare";

const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";

type KakaoSharePayload = {
  objectType: "text";
  text: string;
  link: {
    mobileWebUrl: string;
    webUrl: string;
  };
  buttonTitle: string;
};

type KakaoSdk = {
  isInitialized: () => boolean;
  init: (javascriptKey: string) => void;
  Share?: {
    sendDefault: (payload: KakaoSharePayload) => void;
  };
};

type KakaoWindow = Window & {
  Kakao?: KakaoSdk;
};

let kakaoSdkPromise: Promise<KakaoSdk | null> | null = null;

export function createKakaoAppointmentSharePayload({
  appointmentTitle,
  url
}: {
  appointmentTitle: string;
  url: string;
}): KakaoSharePayload {
  return {
    objectType: "text",
    text: createAppointmentShareMessage({ appointmentTitle, url }),
    link: {
      mobileWebUrl: url,
      webUrl: url
    },
    buttonTitle: "약속 보기"
  };
}

export async function shareAppointmentWithKakao({
  javascriptKey,
  appointmentTitle,
  url
}: {
  javascriptKey?: string;
  appointmentTitle: string;
  url: string;
}) {
  const kakao = await preloadKakaoAppointmentShare({ javascriptKey });
  if (!kakao?.Share?.sendDefault) {
    return false;
  }

  kakao.Share.sendDefault(createKakaoAppointmentSharePayload({ appointmentTitle, url }));
  return true;
}

export async function preloadKakaoAppointmentShare({ javascriptKey }: { javascriptKey?: string }) {
  if (!javascriptKey || typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const kakao = await loadKakaoSdk();
  if (!kakao?.Share?.sendDefault) {
    return null;
  }

  if (!kakao.isInitialized()) {
    kakao.init(javascriptKey);
  }

  return kakao;
}

async function loadKakaoSdk() {
  const kakaoWindow = window as KakaoWindow;
  if (kakaoWindow.Kakao) {
    return kakaoWindow.Kakao;
  }

  kakaoSdkPromise ??= new Promise<KakaoSdk | null>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${KAKAO_SDK_SRC}"]`);
    const script = existing ?? document.createElement("script");

    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.onload = () => resolve((window as KakaoWindow).Kakao ?? null);
    script.onerror = () => resolve(null);

    if (!existing) {
      document.head.appendChild(script);
    }
  });

  return kakaoSdkPromise;
}
