import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * La flor de loto de la marca, trazada en SVG.
 *
 * Misma paleta y trazos que assets/Logo_v1.svg (sin el rectangulo de fondo).
 * No depende de ningun asset nativo: al ser vector, escala sin perder
 * definicion y nunca tumba la pantalla por un recurso faltante.
 */

interface Props {
  /** Lado del lienzo cuadrado que contiene la flor. */
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const LotusFlower: React.FC<Props> = ({
  size = 120,
  style,
  testID = 'lotus-flower',
}) => (
  <View
    testID={testID}
    style={[
      { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
      style,
    ]}
  >
    <Svg width={size} height={size} viewBox="10 38 122 62">
      <Path d="M99.2439 95.3572C116.996 93.1345 129 88.8815 129 84C129 76.8203 103.033 71 71 71C38.9675 71 13 76.8203 13 84C13 91.1797 38.9675 97 71 97C73.6652 97 76.2883 96.9597 78.8581 96.8817L74.1681 88.0625L99.2439 95.3572Z" fill="#9DE187" />
      <Path d="M86.7176 80.4116H55.2428L70.528 90.3574L86.7176 80.4116Z" fill="#FFB6EA" />
      <Path d="M90.5163 74.2383L85.6323 81.0975L120.363 74.2383H90.5163Z" fill="#FFB6EA" />
      <Path d="M50.3588 73.5524L55.2428 80.4116L20.512 73.5524H50.3588Z" fill="#FFB6EA" />
      <Path d="M85.6323 67.3791L91.2719 73.5524L113.521 61.8917L85.6323 67.3791Z" fill="#FFB6EA" />
      <Path d="M54.9131 67.3791L49.2735 73.5524L27.024 61.8917L54.9131 67.3791Z" fill="#FFB6EA" />
      <Path d="M85.0898 67.0361H56.3284L71.5231 59.834L85.0898 67.0361Z" fill="#FFB6EA" />
      <Path d="M70.4377 42L85.4766 66.1787H55.3988L70.4377 42Z" fill="#FF9BC0" />
      <Path d="M91.059 72.4743L86.7176 67.7221L114.936 50.2311L91.059 72.4743Z" fill="#FF9BC0" />
      <Path d="M49.8162 72.4743L54.1575 67.7221L25.9387 50.2311L49.8162 72.4743Z" fill="#FF9BC0" />
      <Path d="M88.8883 71.8376L74.2362 66.6932L92.687 50.917L88.8883 71.8376Z" fill="#FF96BE" />
      <Path d="M51.4441 71.8376L66.0962 66.6932L47.6454 50.917L51.4441 71.8376Z" fill="#FF96BE" />
      <Path d="M84.0042 70.4658L70.4375 68.408L83.4616 50.5741L84.0042 70.4658Z" fill="#FF83B2" />
      <Path d="M56.328 70.4658L69.8948 68.408L56.8707 50.5741L56.328 70.4658Z" fill="#FF83B2" />
      <Path d="M82.3763 73.2095L73.6936 69.094L84.547 53.6607L82.3763 73.2095Z" fill="#FF609C" />
      <Path d="M59.5843 73.2095L68.267 69.094L57.4136 53.6607L59.5843 73.2095Z" fill="#FF609C" />
      <Path d="M79 72H64L71.5 55L79 72Z" fill="#FF3F89" />
      <Path d="M70.8491 87.0769L64.4067 63.4384C69.5964 62.4025 72.6006 62.2897 78.2539 63.5512L70.8491 87.0769Z" fill="#FFF79F" />
      <Path d="M79 81H64L71.5 64L79 81Z" fill="#FF3F89" />
      <Path d="M47.1028 73.8954L54.7002 79.7257L14 61.2058L47.1028 73.8954Z" fill="#FF9BC0" />
      <Path d="M94.315 73.8954L86.7176 79.7257L127.418 61.2058L94.315 73.8954Z" fill="#FF9BC0" />
      <Path d="M86.7177 80.4116H55.2429L70.5768 87.9567L86.7177 80.4116Z" fill="#FF9BC0" />
      <Path d="M112.223 74.2383L73.6937 80.4116L90.5165 74.2383H112.223Z" fill="#FF96BE" />
      <Path d="M29.1947 74.2383L67.7242 80.4116L50.9015 74.2383H29.1947Z" fill="#FF96BE" />
      <Path d="M53.0722 76.2961V70.8087L22.6827 60.5199L53.0722 76.2961Z" fill="#FF96BE" />
      <Path d="M87.803 76.2961V70.8087L118.193 60.5199L87.803 76.2961Z" fill="#FF96BE" />
      <Path d="M70.9802 80.7546L56.3281 74.9243L60.1268 55.7185L70.9802 80.7546Z" fill="#FF609C" />
      <Path d="M71.523 80.7546L86.175 74.9243L82.3764 55.7185L71.523 80.7546Z" fill="#FF609C" />
      <Path d="M91.6017 60.5199L71.5229 80.7545C83.2078 81.9908 88.0864 81.4785 89.431 75.2672L91.6017 60.5199Z" fill="#FF83B2" />
      <Path d="M50.9016 60.5199L70.9803 80.7546C57.267 81.9037 52.3752 81.1785 53.0723 75.2672L50.9016 60.5199Z" fill="#FF83B2" />
    </Svg>
  </View>
);