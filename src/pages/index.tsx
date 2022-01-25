import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { RiCalendarLine, RiUser3Line } from 'react-icons/ri';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [results, setResults] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  useEffect(() => {
    const dateFormattedResults = results.map(post => {
      const formattedFirstPublicationDate = new Date(
        post.first_publication_date
      )
        .toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .replace(/de |\./g, '');

      post.first_publication_date = formattedFirstPublicationDate;

      return post;
    });

    setResults([...dateFormattedResults]);
  }, [nextPage]);

  const handleLoadPosts = event => {
    event.preventDefault();

    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setResults([...results, ...data.results]);
        setNextPage(data.next_page);
      });
  };

  return (
    <>
      <Head>
        <title>Home | spacetravelling.</title>
      </Head>

      <Header />
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <span>
                  <RiCalendarLine className={styles.icon} />
                  {post.first_publication_date}
                </span>
                <span>
                  <RiUser3Line className={styles.icon} />
                  {post.data.author}
                </span>
              </a>
            </Link>
          ))}

          {nextPage && (
            <a className={styles.loadButton} href="/" onClick={handleLoadPosts}>
              Carregar mais posts
            </a>
          )}
        </div>

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.exitPreview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
      preview,
    },
  };
};
