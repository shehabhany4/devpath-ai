import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => (
          <pre className="bg-background my-2 overflow-x-auto rounded-md p-3 text-xs">
            {children}
          </pre>
        ),
        code: ({ children, className }) =>
          className ? (
            <code className={`${className} font-mono`}>{children}</code>
          ) : (
            <code className="bg-background rounded px-1 py-0.5 font-mono text-xs">
              {children}
            </code>
          ),
        p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => (
          <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {children}
          </a>
        ),
        h1: ({ children }) => <h3 className="mt-3 text-base font-bold">{children}</h3>,
        h2: ({ children }) => <h3 className="mt-3 text-base font-bold">{children}</h3>,
        h3: ({ children }) => <h3 className="mt-3 text-sm font-bold">{children}</h3>,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}