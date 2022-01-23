import { useUtterances } from '../../hooks/useUtterances';

const commentNodeId = 'comments';

const Comments = () => {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
};

export default Comments;

// https://github.com/utterance/utterances/issues/161#issuecomment-846918683
