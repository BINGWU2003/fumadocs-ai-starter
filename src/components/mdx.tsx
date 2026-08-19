import {
  Children,
  isValidElement,
  type ComponentProps,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { FileCode2, Rocket } from 'lucide-react';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card as FumadocsCard, Cards } from 'fumadocs-ui/components/card';
import { Tab as FumadocsTab, Tabs as FumadocsTabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';

const icons: Record<string, ReactNode> = {
  rocket: <Rocket />,
  'file-code': <FileCode2 />,
};

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode | string;
  href?: string;
}

function Card({ title, icon, children, className, ...props }: CardProps) {
  const renderedIcon = typeof icon === 'string' ? icons[icon] : icon;

  if (title !== undefined) {
    return (
      <FumadocsCard
        {...props}
        className={className}
        icon={renderedIcon}
        title={title}
      >
        {children}
      </FumadocsCard>
    );
  }

  return (
    <section
      {...props}
      className={`my-4 rounded-xl border bg-fd-card p-4 text-fd-card-foreground ${className ?? ''}`}
    >
      {children}
    </section>
  );
}

function CardGroup({
  cols = 2,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { cols?: number }) {
  const columns = cols === 3 ? 'sm:grid-cols-3' : cols === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2';
  return <Cards {...props} className={`${columns} ${className ?? ''}`} />;
}

function Note(props: Omit<ComponentProps<typeof Callout>, 'type'>) {
  return <Callout {...props} type="info" />;
}

function Tip(props: Omit<ComponentProps<typeof Callout>, 'type'>) {
  return <Callout {...props} type="idea" />;
}

interface CompatTabProps extends Omit<ComponentProps<typeof FumadocsTab>, 'value'> {
  title: string;
  value?: string;
}

function Tab({ title: _title, ...props }: CompatTabProps) {
  return <FumadocsTab {...props} />;
}

function Tabs({
  children,
  sync: _sync,
  ...props
}: Omit<ComponentProps<typeof FumadocsTabs>, 'items'> & {
  children: ReactNode;
  sync?: boolean;
}) {
  const items = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => (child as ReactElement<CompatTabProps>).props.title);

  return (
    <FumadocsTabs {...props} items={items}>
      {children}
    </FumadocsTabs>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Card,
    CardGroup,
    Note,
    Tip,
    Tab,
    Tabs,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
