# How to Open a Pull Request

We’re excited to have you contribute to [Urbis-Workflows](https://github.com/OpenUrbis/urbis-workflows)! Here’s a straightforward guide to submitting a _pull request_ (PR):

## Quick Steps

1. **Fork and Clone**

   - Fork the repository on GitHub and clone it to your local machine:
     ```bash
     git clone https://github.com/OpenUrbis/urbis-workflows.git
     ```

2. **Create a Branch**

   - Make a new branch for your changes:
     ```bash
     git checkout -b my-changes
     ```

3. **Make Your Changes**

   - Add your code, fix bugs, or update docs. Keep it clean and test your work.

4. **Commit Your Work**

   - Follow our [Commit Guidelines](docs/COMMIT-GUIDELINES.md) for the message format. Example:
     ```bash
     git commit -m "feat(client): add new button"
     ```

5. **Push to Your Fork**

   - Send your branch to your GitHub fork:
     ```bash
     git push origin my-changes
     ```

6. **Open a Pull Request**

   - Go to the [Urbis-Workflows GitHub page](https://github.com/OpenUrbis/urbis-workflows), switch to your branch, and click "New Pull Request".
   - Write a short description of what you did and why.

7. **Respond to Feedback**
   - We’ll review your PR. If we suggest changes, update your branch and push again.

## Tips

- Test your changes before submitting (`yarn test` is your friend).
- Keep PRs small and focused—it makes them easier to review.
- Check out [Contributing Guide](docs/CONTRIBUTING.md) for more details if needed.

That’s it! Thanks for helping make Urbis-Workflows better.
