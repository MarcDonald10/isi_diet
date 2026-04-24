// App.js
import { AuthProvider } from "./contexts/AuthContext";
import AppNavigate from "./navigation/AppNavigate";

export default function App() {
    return (
        <AuthProvider>
            <AppNavigate />
        </AuthProvider>
    );
}