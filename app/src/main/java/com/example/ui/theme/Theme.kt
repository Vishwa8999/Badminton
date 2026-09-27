package com.example.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = TrophyGold,
    onPrimary = Slate950,
    primaryContainer = Slate800,
    onPrimaryContainer = TrophyGoldLight,
    secondary = ElectricCyan,
    onSecondary = Slate950,
    secondaryContainer = Slate800,
    onSecondaryContainer = ElectricCyan,
    tertiary = NeonGreen,
    onTertiary = Slate950,
    background = Slate950,
    onBackground = Slate100,
    surface = Slate900,
    onSurface = Slate100,
    surfaceVariant = Slate800,
    onSurfaceVariant = Slate300,
    outline = Slate700,
    error = CoralRed,
    onError = Color.White
)

private val LightColorScheme = darkColorScheme(
    // We enforce an intentional high-contrast dark gaming/sports look for maximum immersion
    primary = TrophyGold,
    onPrimary = Slate950,
    primaryContainer = Slate800,
    onPrimaryContainer = TrophyGoldLight,
    secondary = ElectricCyan,
    onSecondary = Slate950,
    secondaryContainer = Slate800,
    onSecondaryContainer = ElectricCyan,
    tertiary = NeonGreen,
    onTertiary = Slate950,
    background = Slate950,
    onBackground = Slate100,
    surface = Slate900,
    onSurface = Slate100,
    surfaceVariant = Slate800,
    onSurfaceVariant = Slate300,
    outline = Slate700,
    error = CoralRed,
    onError = Color.White
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = Slate950.toArgb()
                window.navigationBarColor = Slate950.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
