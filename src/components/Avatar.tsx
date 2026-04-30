import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { shouldRenderRemoteAvatar } from "./avatarState";
import { colors } from "../theme";

const DEFAULT_AVATAR = require("../../assets/wayt-icon.png");

type AvatarProps = {
  uri?: string;
  name: string;
  size?: number;
  accent?: string;
  overlap?: boolean;
};

export function Avatar({ uri, name, size = 48, accent = colors.primary, overlap }: AvatarProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const renderRemoteAvatar = shouldRenderRemoteAvatar(uri, imageLoadFailed);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [uri]);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginLeft: overlap ? -10 : 0
        }
      ]}
    >
      {renderRemoteAvatar ? (
        <Image
          source={{ uri: uri as string }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <View style={[styles.fallback, { backgroundColor: accent }]}>
          <Image source={DEFAULT_AVATAR} style={{ width: size, height: size, borderRadius: size / 2 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: colors.primarySoft
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
