package com.flowtrack.security;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.Map;

@Service
public class LoginAttemptService {
    private static final int MAX_ATTEMPT = 3;
    private static final int BLOCK_DURATION_MINS = 1; // 1 minute as per guideline 2b
    private Map<String, Integer> attemptsCache = new ConcurrentHashMap<>();
    private Map<String, Long> blockCache = new ConcurrentHashMap<>();

    public void loginSucceeded(String key) {
        attemptsCache.remove(key);
        blockCache.remove(key);
    }

    public void loginFailed(String key) {
        int attempts = attemptsCache.getOrDefault(key, 0) + 1;
        attemptsCache.put(key, attempts);
        if (attempts >= MAX_ATTEMPT) {
            blockCache.put(key, System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(BLOCK_DURATION_MINS));
        }
    }

    public boolean isBlocked(String key) {
        if (!blockCache.containsKey(key)) {
            return false;
        }
        long unblockTime = blockCache.get(key);
        if (System.currentTimeMillis() > unblockTime) {
            blockCache.remove(key);
            attemptsCache.remove(key);
            return false;
        }
        return true;
    }
}
