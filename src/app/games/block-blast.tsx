import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { GameOverModal } from '@/components/game-over-modal';
import Game, { BlockBlastMode, GameHandle, GameOverInfo } from '@/components/games/block-blast/Game';
import { getISTMonthKey } from '@/constants/games/block-blast/Rng';
import { useProfile } from '@/hooks/use-profile';
import { continueForCoins } from '@/lib/coins';
import { getMyBestScore } from '@/lib/leaderboard';
import { submitRankedScore } from '@/lib/ranked';
import { supabase } from '@/lib/supabase';

const GAME_ID = 'block_blast';

function isValidMode(value: string | string[] | undefined): value is BlockBlastMode {
	return value === 'ranked' || value === 'classic';
}

export default function BlockBlastScreen() {
	const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
	const { profile, refetch: refetchProfile } = useProfile();
	const gameRef = useRef<GameHandle>(null);

	const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);
	const [previousBest, setPreviousBest] = useState<number | null>(null);
	const [sessionKey, setSessionKey] = useState(0);
	const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [continuing, setContinuing] = useState(false);

	// Sanity guard: a stale bookmark / direct link with no mode param must
	// never silently default to either mode — that ambiguity is exactly how
	// this bug happened once already. Send them back to choose explicitly.
	if (!isValidMode(modeParam)) {
		router.replace(`/games/mode-select?gameId=${GAME_ID}` as any);
		return null;
	}
	const mode: BlockBlastMode = modeParam;

	const handleGameOver = useCallback((info: GameOverInfo) => {
		setGameOverInfo(info);

		if (mode !== 'ranked') return;

		// Regression fix: this used to gate on the `session` value from the
		// useSession() React-state hook. If that value was stale or briefly
		// null at the exact moment game-over fired — a real risk on native,
		// where Reanimated's runOnJS bridges across a genuine separate UI
		// thread (unlike web, where "worklets" just run synchronously in the
		// same JS context) — this whole block was silently skipped: no
		// setSubmitStatus('submitting') ever ran, so the modal showed no
		// status text at all, which read as a clean success even though
		// nothing was ever sent. Fetching the session fresh here removes the
		// dependency on that hook's timing entirely, and every outcome
		// (including "not signed in") now sets an explicit status.
		setSubmitStatus('submitting');
		setSubmitError(null);

		(async () => {
			const { data: { session: freshSession } } = await supabase.auth.getSession();
			if (!freshSession) {
				throw new Error('Not signed in — score was not saved.');
			}

			// Capture the pre-this-run best BEFORE submitting, so "New Best!"
			// compares against what the player had walking in, not a number
			// that already includes this very run.
			getMyBestScore(freshSession.user.id, GAME_ID, getISTMonthKey())
				.then(setPreviousBest)
				.catch(() => {});

			await submitRankedScore(GAME_ID, info.finalScore, info.moveCount, info.finalBoardState);
		})()
			.then(() => setSubmitStatus('submitted'))
			.catch((err) => {
				setSubmitStatus('error');
				setSubmitError(err instanceof Error ? err.message : String(err));
			});
	}, [mode]);

	const handlePlayAgain = useCallback(() => {
		setGameOverInfo(null);
		setPreviousBest(null);
		setSubmitStatus('idle');
		setSubmitError(null);
		setSessionKey((key) => key + 1);
	}, []);

	const handleContinue = useCallback(async () => {
		setContinuing(true);
		try {
			await continueForCoins();
			refetchProfile();
			setGameOverInfo(null);
			gameRef.current?.continueGame();
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : String(err));
		} finally {
			setContinuing(false);
		}
	}, [refetchProfile]);

	if (gameOverInfo != null) {
		return (
			<GameOverModal
				mode={mode}
				finalScore={gameOverInfo.finalScore}
				previousBest={previousBest}
				submitStatus={submitStatus}
				submitError={submitError}
				coinCount={profile?.coins}
				continuing={continuing}
				onRetry={handlePlayAgain}
				onContinue={handleContinue}
				onBackHome={() => router.push('/')}
			/>
		);
	}

	return (
		<Game
			key={sessionKey}
			ref={gameRef}
			mode={mode}
			onGameOver={handleGameOver}
			coinCount={profile?.coins}
			onPausePress={() => router.back()}
		/>
	);
}
