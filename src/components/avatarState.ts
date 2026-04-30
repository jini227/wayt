export function shouldRenderRemoteAvatar(uri: string | undefined, imageLoadFailed: boolean) {
  return Boolean(uri) && !imageLoadFailed;
}
