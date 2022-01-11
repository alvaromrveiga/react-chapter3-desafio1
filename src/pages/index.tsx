import { useState } from 'react';
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
}

export default function Home({ postsPagination }: HomeProps) {
  const [results, setResults] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleLoadPosts = event => {
    event.preventDefault();

    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const newPosts = data.results.map(post => {
          const first_publication_date = new Date(post.first_publication_date)
            .toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
            .replace(/de |\./g, '');

          const capitalizeMonthFirstLetter = first_publication_date
            .charAt(3)
            .toUpperCase();

          const formattedFirstPublicationDate =
            first_publication_date.substring(0, 3) +
            capitalizeMonthFirstLetter +
            first_publication_date.substring(4, first_publication_date.length);

          return {
            uid: post.uid,
            first_publication_date: formattedFirstPublicationDate,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setResults([...results, ...newPosts]);
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
            <Link href={`/post/${post.uid}`}>
              <a key={post.uid}>
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
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    const first_publication_date = new Date(post.first_publication_date)
      .toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/de |\./g, '');

    const capitalizeMonthFirstLetter = first_publication_date
      .charAt(3)
      .toUpperCase();

    const formattedFirstPublicationDate =
      first_publication_date.substring(0, 3) +
      capitalizeMonthFirstLetter +
      first_publication_date.substring(4, first_publication_date.length);

    return {
      uid: post.uid,
      first_publication_date: formattedFirstPublicationDate,
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
    },
  };
};
