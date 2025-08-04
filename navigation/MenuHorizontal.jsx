// src/navigation/MenuHorizontal.js
import React from "react";
import { TouchableOpacity, View, StyleSheet, Platform } from "react-native";
import { Text } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/pages/HomeScreen";
import ProfileScreen from "../screens/pages/ProfileScreen";
import MealPlanScreen from "../screens/pages/MealPlanScreen";
import { useFonts, Poppins_700Bold, Poppins_400Regular } from "@expo-google-fonts/poppins";
import Messagerie from "../screens/pages/Messageries/Messagerie";


const HomeStack = createBottomTabNavigator();

function CustomHomeBar({ state, descriptors, navigation }) {
    const [fontsLoaded] = useFonts({ Poppins_700Bold, Poppins_400Regular });

    if (!fontsLoaded) return null;

    const tabConfig = {
        Home: { icon: <Ionicons name="home" size={26} />, label: "Accueil" },
        MealPlan: { icon: <Ionicons name="restaurant" size={26} />, label: "Plans" },
        Messagerie: { icon: <Ionicons name="chatbubble" size={26} />, label: "Classes" },
        Profile: { icon: <Ionicons name="person" size={26} />, label: "Profil" },
    };

    return (
        <View style={styles.barContainer}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const { icon, label } = tabConfig[route.name] || {
                    icon: <Ionicons name="ellipse" size={26} color={'#B0B3C6'} />,
                    label: route.name,
                };

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: "tabLongPress",
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={label}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={[
                            styles.tabButton,
                            isFocused && styles.tabButtonActive,
                        ]}
                        activeOpacity={0.85}
                    >
                        <View style={[
                            styles.tabContent,
                            isFocused && styles.tabContentActive
                        ]}>
                            {React.cloneElement(icon, {
                                color: isFocused ? "#815F9C" : "#7D5F9B",
                                style: { marginBottom: 2 }
                            })}
                            <Text
                                style={[
                                    styles.tabLabel,
                                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                                    { fontFamily: isFocused ? "Poppins_700Bold" : "Poppins_400Regular" }
                                ]}
                                numberOfLines={1}
                            >
                                {label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const MenuHorizontal = () => {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
            tabBar={(props) => <CustomHomeBar {...props} />}
            initialRouteName="Home"
        >

            <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Isidiet' }} />
            <HomeStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
            <HomeStack.Screen name="MealPlan" component={MealPlanScreen} options={{ title: 'Plans Alimentaires' }} />
            <HomeStack.Screen name="Messagerie" component={Messagerie} options={{ title: 'Master Classes & Messagerie' }} />
            
        </HomeStack.Navigator>
    );
};

export default MenuHorizontal;

const styles = StyleSheet.create({
    barContainer: {
        flexDirection: "row",
        backgroundColor: "#F6F0F5", // magnolia
        height: 80,
        marginBottom: Platform.OS === "ios" ? 32 : 12,
        paddingHorizontal: 12,
        // paddingVertical: 10,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        shadowColor: "#815F9C", // pomp-and-power
        shadowOpacity: 0.10,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        elevation: 10,
    },
    tabButton: {
        flex: 1,
        borderRadius: 18,
        marginHorizontal: 6,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        minWidth: 70,
    },
    tabButtonActive: {
        flex: 1.15,
    },
    tabContent: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 8,
        backgroundColor: "transparent",
        transitionDuration: "200ms",
        minWidth: 60,
    },
    tabContentActive: {
        backgroundColor: "#fff",
        shadowColor: "#815F9C",
        shadowOpacity: 0.13,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
    },
    tabLabel: {
        fontSize: 14,
        marginTop: 4,
        letterSpacing: 0.2,
        textAlign: "center",
    },
    tabLabelActive: {
        color: "#815F9C", // pomp-and-power
        fontWeight: "bold",
    },
    tabLabelInactive: {
        color: "#7D5F9B", // pomp-and-power-2
        fontWeight: "400",
    },
});