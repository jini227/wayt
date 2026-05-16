import assert from "node:assert/strict";
import { createKakaoAppointmentSharePayload } from "./kakaoAppointmentShare";

assert.deepEqual(
  createKakaoAppointmentSharePayload({
    appointmentTitle: "테스트",
    url: "http://52.79.233.46/wayt/appointments/abc"
  }),
  {
    objectType: "text",
    text: "테스트\nhttp://52.79.233.46/wayt/appointments/abc",
    link: {
      mobileWebUrl: "http://52.79.233.46/wayt/appointments/abc",
      webUrl: "http://52.79.233.46/wayt/appointments/abc"
    },
    buttonTitle: "약속 보기"
  },
  "Kakao share payload points at the public appointment detail URL"
);
