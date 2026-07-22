import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { SharedValue, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Ranked's "best score" is the server-derived MAX(validated Ranked score) for
// this month (see submit-ranked-score / 03_read_queries.sql) — the caller
// (game screen, Phase 5) fetches it from Supabase and passes it in as a plain
// prop, rather than this component reading local device storage. Same for
// coinCount — coins aren't wired to a real backend/local store yet either.
interface GameHudProps {
	score: SharedValue<number>,
	bestScore?: number,
	coinCount?: number,
	onPausePress?: () => void,
}

export function GameHud({ score, bestScore = 0, coinCount = 0, onPausePress }: GameHudProps) {
	const insets = useSafeAreaInsets();
	const [scoreText, setScoreText] = useState("0");
	const [liveScore, setLiveScore] = useState(score.value);
	const scoreAnimValue = useSharedValue(0);

	useAnimatedReaction(() => {
		return score.value;
	}, (current, _prev) => {
		scoreAnimValue.value = withTiming(current, { duration: 200 });
		runOnJS(setLiveScore)(current);
	});

	useAnimatedReaction(() => {
		return scoreAnimValue.value
	}, (current, _prev) => {
		runOnJS(setScoreText)(String(Math.floor(current)));
	})

	return (
		<View style={[styles.root, { top: insets.top + 8, paddingHorizontal: Math.max(insets.left, insets.right, 16) }]}>
			<View style={styles.leftCluster}>
				{onPausePress && (
					<Pressable onPress={onPausePress} style={styles.pauseButton}>
						<Text style={styles.pauseIcon}>{"⏸"}</Text>
					</Pressable>
				)}
				<View style={styles.statsColumn}>
					<View style={styles.statRow}>
						<Text style={styles.statIcon}>{"👑"}</Text>
						<Text style={styles.statText}>{Math.max(liveScore, bestScore)}</Text>
					</View>
					<View style={styles.statRow}>
						<Text style={styles.statIcon}>{"🪙"}</Text>
						<Text style={styles.statText}>{coinCount}</Text>
					</View>
				</View>
			</View>

			<Text style={styles.scoreText}>{scoreText}</Text>

			{/* Placeholder avatar — becomes the real user avatar once Google auth (Phase 4) is wired in. */}
			<View style={styles.avatar}>
				<Text style={styles.avatarIcon}>{"👤"}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		position: 'absolute',
		left: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		zIndex: 1000,
	},
	leftCluster: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	pauseButton: {
		width: 40,
		height: 40,
		borderRadius: 14,
		backgroundColor: 'rgba(20, 20, 30, 0.55)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	pauseIcon: {
		color: 'white',
		fontSize: 18,
	},
	statsColumn: {
		flexDirection: 'column',
		gap: 2,
	},
	statRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	statIcon: {
		fontSize: 18,
	},
	statText: {
		color: 'white',
		fontFamily: 'Silkscreen',
		fontSize: 16,
		fontWeight: '100',
		textShadowColor: 'rgb(0, 0, 0)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 4,
	},
	scoreText: {
		color: 'white',
		fontFamily: 'Silkscreen',
		fontSize: 40,
		fontWeight: '100',
		textShadowColor: 'rgb(0, 0, 0)',
		textShadowOffset: { width: 3, height: 3 },
		textShadowRadius: 10,
		alignSelf: 'center',
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(20, 20, 30, 0.55)',
		borderWidth: 2,
		borderColor: 'rgba(255, 255, 255, 0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	avatarIcon: {
		fontSize: 20,
	},
})
