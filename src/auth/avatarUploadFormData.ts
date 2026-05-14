export type AvatarUploadFile = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

type AppendableFormData = {
  append(name: string, value: Blob | string | unknown, fileName?: string): void;
};

export function appendAvatarFileToFormData(
  formData: AppendableFormData,
  avatar: AvatarUploadFile,
  platformOS: string
) {
  if (platformOS === "web" && avatar.file) {
    formData.append("file", avatar.file, avatar.name);
    return;
  }

  formData.append("file", {
    uri: avatar.uri,
    name: avatar.name,
    type: avatar.type
  } as unknown as Blob);
}
