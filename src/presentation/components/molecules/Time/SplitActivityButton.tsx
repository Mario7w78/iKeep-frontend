import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Theme } from '../../theme/colors'
import { AntDesign } from '@expo/vector-icons'

export default function SplitActivityButton() {
  return (
    <View>
      <View style={{
        flexDirection: 'row',
        gap: 10,
      }}>
        <TouchableOpacity style={{
            backgroundColor: Theme.colors.lightPrimary,
            paddingHorizontal: 15,
            paddingVertical: 5,
            borderRadius: 10,
            borderWidth:1,
            borderColor: Theme.colors.veryLightPrimary
        }}>
            <Text style={{
                color: Theme.colors.surface,
                fontWeight: 'bold',
            }}>
                1
            </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{
            backgroundColor: Theme.colors.lightBackground,
            width: 30,
            height: 30,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: Theme.colors.veryLightPrimary
        }}>
            <AntDesign name='plus' size={12} color={Theme.colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  )
}