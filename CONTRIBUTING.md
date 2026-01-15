# Contributing to Simulive

## Code Standards

- **Runtime**: Bun
- **Language**: TypeScript
- **Style**: TailwincCSS, Shadcn UI

## Memory Management & Cleanup (CRITICAL)

To prevent memory leaks in this real-time application, strict adherence to
cleanup is required.

### Checklist

1. **Hooks**: Ensure EVERY `useEffect` returns a cleanup function:
   - `return () => unsubscribe()` (Firestore listeners)
   - `return () => clearInterval(id)` (Intervals)
   - `return () => clearTimeout(id)` (Timeouts)
   - `return () => removeEventListener(...)` (DOM events)

2. **Video Players**:
   - Always pause and clear video sources on unmount.
   - Use the standard cleanup pattern:
     ```typescript
     useEffect(() => {
         const player = videoRef.current;
         return () => {
             if (player) {
                 player.pause();
                 player.src = "";
                 player.load();
             }
         };
     }, []);
     ```

3. **Firestore**:
   - Do NOT use `onSnapshot` without capturing the unsubscribe function.
   - Example:
     ```typescript
     // ✅ Correct
     useEffect(() => {
       const unsub = onSnapshot(...);
       return () => unsub();
     }, []);

     // ❌ Wrong
     useEffect(() => {
       onSnapshot(...); // Leaks!
     }, []);
     ```

4. **Testing leaks**:
   - Use Chrome DevTools > Memory > Heap Snapshot.
   - Verify detached DOM nodes do not increase after navigation.
