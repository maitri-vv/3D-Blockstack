## Pull Request Title Convention
Please ensure your PR title follows this format: [Type]: Short, descriptive summary of changes

Examples:
- [Feature]: Implement high score system using localStorage
- [Bugfix]: Resolve camera clipping on narrow viewports
- [CI/CD]: Add code formatting check with Prettier

## 🎯 What issue does this address?
Closes #

## ✨ What does this change?

## Checklist:
- [ ] New functionality meets the goals defined in the linked issue.
- [ ] If changing the UI or game experience, screenshots or a GIF are included below.
- [ ] Code is formatted cleanly (ran Prettier/ESLint locally).
- [ ] All CI/CD checks in this PR passed.
- [ ] Game mechanics work correctly (blocks stack, physics behave properly).
- [ ] Performance is maintained (no frame drops or lag introduced).
- [ ] Mobile/touch controls still function properly.
- [ ] Game resets correctly with 'R' key.

## 🖼️ Screenshots / Video Preview
| Before Changes | After Changes |
| :---: | :---: |
| [Screenshot of old state] | [Screenshot of new state] |

## 🧪 Testing
### Steps to Test Locally (for Reviewer):
1. Clone this branch locally.
2. Open `index.html` in your browser.
3. Test core game functionality:
   - Click/tap/spacebar to drop blocks
   - Verify blocks stack properly with physics
   - Test 'R' key to reset game
   - Check mobile touch controls work
4. Verify the changes (e.g., if it's a bug fix, confirm the bug is gone).
5. Check browser console for any new errors or warnings.
6. Test on different screen sizes/devices if UI changes were made.

## 🔗 Related Resources