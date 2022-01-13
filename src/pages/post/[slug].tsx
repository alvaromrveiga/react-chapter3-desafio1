import { GetStaticPaths, GetStaticProps } from 'next';
import { useEffect, useState } from 'react';
import { RiCalendarLine, RiUser3Line } from 'react-icons/ri';
import { AiOutlineClockCircle } from 'react-icons/ai';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

const displayNone = {
  // Challenge was not accepting render content or render loading
  // so when the posts is loaded the "Loading..." is set to display none
  display: 'none',
};

export default function Post({ post }: PostProps) {
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    if (post) {
      let totalWordsCount = 0;

      post.data.content.forEach(section => {
        if (section.heading) {
          totalWordsCount += section.heading.split(' ').length;
        }

        section.body.forEach(paragraph => {
          totalWordsCount += paragraph.text?.split(' ').length;
        });
      });

      setReadingTime(Math.ceil(totalWordsCount / 200));

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
    }
  }, [post]);

  return (
    <div>
      <Header />

      {post && (
        <>
          <img
            src={post.data.banner.url}
            alt="banner"
            className={styles.banner}
          />

          <article className={styles.content}>
            <h1>{post.data.title}</h1>
            <span>
              <RiCalendarLine className={styles.icon} />
              {post.first_publication_date}
            </span>
            <span>
              <RiUser3Line className={styles.icon} />
              {post.data.author}
            </span>
            <span>
              <AiOutlineClockCircle className={styles.icon} />
              {readingTime} min
            </span>

            {post.data.content.map(section => (
              <section key={section.heading}>
                <h3>{section.heading}</h3>

                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph.text}</p>
                ))}
              </section>
            ))}
          </article>
        </>
      )}

      <p style={post ? displayNone : {}}>Carregando...</p>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      { params: { slug: 'como-utilizar-hooks' } },
      { params: { slug: 'criando-um-app-cra-do-zero' } },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: { ...response.data },
  };

  return {
    props: { post },
  };
};
