import { TSESLint } from '@typescript-eslint/utils'
import { includeJa } from '../utils'

export const noJpComment: TSESLint.RuleModule<'noJpComment', []> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect Japanese comments',
      recommended: 'warn'
    },
    schema: [],
    messages: {
      noJpComment: 'Japanese comment detected'
    }
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.getSourceCode()

    return {
      Program() {
        const comments = sourceCode.getAllComments()

        comments.forEach((comment) => {
          if (includeJa(comment.value)) {
            context.report({
              node: comment,
              messageId: 'noJpComment'
            })
          }
        })
      }
    }
  }
}
