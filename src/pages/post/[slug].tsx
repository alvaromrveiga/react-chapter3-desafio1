import Prismic from '@prismicio/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { RiCalendarLine, RiUser3Line } from 'react-icons/ri';
import Comments from '../../components/Comments';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  nextPost: Post;
  prevPost: Post;
  preview: boolean;
}

const displayNone = {
  // Challenge was not accepting render content or render loading
  // so when the posts is loaded the "Loading..." is set to display none
  display: 'none',
};

export default function Post({ post, nextPost, prevPost, preview }: PostProps) {
  const [readingTime, setReadingTime] = useState(0);
  const [postPublicationDate, setPostPublicationDate] = useState('');
  const [postEditedDate, setPostEditedDate] = useState('');

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

      if (post.first_publication_date === post.last_publication_date) {
        post.last_publication_date = null;
        setPostEditedDate('');
      }

      const formattedFirstPublicationDate = new Date(
        post.first_publication_date
      )
        .toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .replace(/de |\./g, '');

      setPostPublicationDate(formattedFirstPublicationDate);

      if (post.last_publication_date) {
        const formattedLastPublicationDate = new Date(
          post.last_publication_date
        )
          .toLocaleDateString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .replace(/de |\./g, '');

        setPostEditedDate(
          formattedLastPublicationDate.substring(0, 11) +
            ', às ' +
            formattedLastPublicationDate.substring(
              11,
              formattedLastPublicationDate.length
            )
        );
      }
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
              {postPublicationDate}
            </span>
            <span>
              <RiUser3Line className={styles.icon} />
              {post.data.author}
            </span>
            <span>
              <AiOutlineClockCircle className={styles.icon} />
              {readingTime} min
            </span>
            {postEditedDate && (
              <p className={styles.editedTime}>* editado em {postEditedDate}</p>
            )}

            {post.data.content.map(section => (
              <section key={section.heading} className={styles.postContent}>
                <h3>{section.heading}</h3>

                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph.text}</p>
                ))}
              </section>
            ))}

            <section className={styles.postNavigation}>
              {prevPost ? (
                <Link href={`/post/${prevPost.uid}`}>
                  <a>
                    <span>{prevPost.data.title}</span>
                    <p>Post anterior</p>
                  </a>
                </Link>
              ) : (
                <span />
              )}

              {nextPost ? (
                <Link href={`/post/${nextPost.uid}`}>
                  <a className={styles.nextPost}>
                    <span className={styles.nextPost}>
                      {nextPost.data.title}
                    </span>
                    <p>Próximo post</p>
                  </a>
                </Link>
              ) : (
                <span />
              )}
            </section>

            <Comments commentNodeId={post.uid} />

            {preview && (
              <aside>
                <Link href="/api/exit-preview">
                  <a className={commonStyles.exitPreview}>
                    Sair do modo Preview
                  </a>
                </Link>
              </aside>
            )}
          </article>
        </>
      )}

      <p className={commonStyles.container} style={post ? displayNone : {}}>
        Carregando...
      </p>
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const nextResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date desc]',
      ref: previewData?.ref ?? null,
    }
  );
  const prevResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date]',
      ref: previewData?.ref ?? null,
    }
  );
  const nextPost = nextResponse?.results[0] || null;
  const prevPost = prevResponse?.results[0] || null;

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: { ...response.data },
  };

  return {
    props: { post, preview, nextPost, prevPost },
  };
};
