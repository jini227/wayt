import assert from "node:assert/strict";
import { createAppointmentShareMessage, createAppointmentShareUrl } from "./appointmentShare";

assert.equal(
  createAppointmentShareUrl({
    appointmentId: "82891455-7f27-4e93-8b6c-87e13c5589aa",
    currentHref: "http://52.79.233.46/wayt/appointments/old"
  }),
  "http://52.79.233.46/wayt/appointments/82891455-7f27-4e93-8b6c-87e13c5589aa",
  "appointment share urls keep the deployed /wayt base path"
);

assert.equal(
  createAppointmentShareUrl({
    appointmentId: "A B",
    currentHref: "https://example.com/profile"
  }),
  "https://example.com/appointments/A%20B",
  "appointment share urls encode ids and omit unrelated base paths"
);

assert.equal(
  createAppointmentShareUrl({
    appointmentId: "abc"
  }),
  "/appointments/abc",
  "appointment share urls fall back to an app path without a browser origin"
);

assert.equal(
  createAppointmentShareMessage({
    appointmentTitle: "테스트",
    url: "http://52.79.233.46/wayt/appointments/abc"
  }),
  "테스트\nhttp://52.79.233.46/wayt/appointments/abc",
  "appointment share messages do not describe the URL as an invite link"
);
