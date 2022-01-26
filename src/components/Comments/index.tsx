import { useUtterances } from '../../hooks/useUtterances';

interface CommentsProps {
  commentNodeId?: string;
}

const Comments = ({ commentNodeId = 'comments' }: CommentsProps) => {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
};

export default Comments;

// https://github.com/utterance/utterances/issues/161#issuecomment-846918683
