import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    increment,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Ajouter un commentaire à un post/master class
 */
export const addComment = async (postId, commentData) => {
  try {
    const dataToAdd = {
      postId,
      text: commentData.text,
      author: commentData.author || 'Utilisateur',
      authorAvatar: commentData.authorAvatar || 'https://randomuser.me/api/portraits/women/44.jpg',
      userId: commentData.userId || null,
      createdAt: Timestamp.now(),
      likes: 0,
      isLiked: false,
      parentCommentId: commentData.parentCommentId || null, // Pour les réponses
    };

    const docRef = await addDoc(collection(db, 'comments'), dataToAdd);
    return { id: docRef.id, ...dataToAdd, createdAt: new Date() };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    throw error;
  }
};

/**
 * Récupérer tous les commentaires d'un post
 */
export const getComments = async (postId) => {
  try {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('parentCommentId', '==', null),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const comments = [];

    for (const docSnap of querySnapshot.docs) {
      const commentData = docSnap.data();
      const replies = await getReplies(docSnap.id);

      comments.push({
        id: docSnap.id,
        ...commentData,
        createdAt: commentData.createdAt?.toDate?.() || new Date(commentData.createdAt),
        replies,
      });
    }

    return comments;
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error);
    throw error;
  }
};

/**
 * Récupérer les réponses d'un commentaire
 */
export const getReplies = async (commentId) => {
  try {
    const q = query(
      collection(db, 'comments'),
      where('parentCommentId', '==', commentId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    throw error;
  }
};

/**
 * Supprimer un commentaire
 */
export const deleteComment = async (commentId) => {
  try {
    // Supprimer d'abord toutes les réponses
    const replies = await getReplies(commentId);
    for (const reply of replies) {
      await deleteDoc(doc(db, 'comments', reply.id));
    }

    // Puis supprimer le commentaire
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    throw error;
  }
};

/**
 * Mettre à jour le nombre de likes d'un commentaire
 */
export const updateCommentLikes = async (commentId, userId, isLiking) => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const likeKey = `likedBy_${userId}`;
    
    // Récupérer le document actuel
    const commentSnap = await getDocs(query(collection(db, 'comments'), where('__name__', '==', commentId)));
    const currentLikes = commentSnap.docs[0]?.data().likes || 0;
    
    const update = {
      [likeKey]: isLiking,
      likes: isLiking ? currentLikes + 1 : Math.max(0, currentLikes - 1),
    };

    await updateDoc(commentRef, update);
    return update.likes;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des likes:', error);
    throw error;
  }
};

/**
 * Ajouter une réponse à un commentaire
 */
export const addReply = async (parentCommentId, postId, replyData) => {
  try {
    return await addComment(postId, {
      ...replyData,
      parentCommentId,
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réponse:', error);
    throw error;
  }
};

/**
 * Compter les commentaires d'un post
 */
export const countComments = async (postId) => {
  try {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('parentCommentId', '==', null)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erreur lors du comptage des commentaires:', error);
    throw error;
  }
};

/**
 * Ajouter une vue à un post/master class
 */
export const addView = async (postId) => {
  try {
    const viewRef = doc(db, 'views', postId);
    const viewData = {
      postId,
      viewCount: 1,
      lastViewed: Timestamp.now(),
      viewers: [],
    };

    // Essayer de mettre à jour, sinon créer
    try {
      const currentDoc = await getDocs(query(collection(db, 'views'), where('postId', '==', postId)));
      if (currentDoc.docs.length > 0) {
        const docId = currentDoc.docs[0].id;
        await updateDoc(doc(db, 'views', docId), {
          viewCount: (currentDoc.docs[0].data().viewCount || 0) + 1,
          lastViewed: Timestamp.now(),
        });
        return (currentDoc.docs[0].data().viewCount || 0) + 1;
      }
    } catch (e) {
      // Créer un nouveau document
      await addDoc(collection(db, 'views'), viewData);
      return 1;
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la vue:', error);
    throw error;
  }
};

/**
 * Récupérer le nombre de vues d'un post
 */
export const getViewCount = async (postId) => {
  try {
    const q = query(collection(db, 'views'), where('postId', '==', postId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs[0]?.data().viewCount || 0;
  } catch (error) {
    console.error('Erreur lors de la récupération des vues:', error);
    return 0;
  }
};

/**
 * Récupérer les statistiques complètes d'un post
 */
export const getPostStats = async (postId) => {
  try {
    const stats = {
      comments: 0,
      likes: 0,
      views: 0,
    };

    // Compter les commentaires
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('parentCommentId', '==', null)
    );
    const commentsSnap = await getDocs(commentsQuery);
    stats.comments = commentsSnap.size;

    // Compter les likes totaux de tous les commentaires
    const allCommentsQuery = query(collection(db, 'comments'), where('postId', '==', postId));
    const allCommentsSnap = await getDocs(allCommentsQuery);
    stats.likes = allCommentsSnap.docs.reduce((sum, doc) => sum + (doc.data().likes || 0), 0);

    // Récupérer les vues
    stats.views = await getViewCount(postId);

    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return { comments: 0, likes: 0, views: 0 };
  }
};

/**
 * Vérifier si un utilisateur a liké un commentaire
 */
export const checkIfUserLiked = async (commentId, userId) => {
  try {
    const q = query(collection(db, 'comments'), where('__name__', '==', commentId));
    const snap = await getDocs(q);
    if (snap.docs.length === 0) return false;
    
    const commentData = snap.docs[0].data();
    const likeKey = `likedBy_${userId}`;
    return commentData[likeKey] === true;
  } catch (error) {
    console.error('Erreur lors de la vérification du like:', error);
    return false;
  }
};

/**
 * Toggle le like d'un utilisateur sur un post/master class
 */
export const togglePostLike = async (postId, userId) => {
  try {
    const postRef = doc(db, 'masterClasses', postId);
    const likeKey = `likedBy_${userId}`;

    // Incrémenter ou décrémenter le nombre de likes
    await updateDoc(postRef, {
      [likeKey]: true,
      likes: increment(1),
    });

    return true;
  } catch (error) {
    console.error('Erreur lors du like du post:', error);
    throw error;
  }
};

/**
 * Vérifier si un utilisateur a liké un post
 */
export const checkIfUserLikedPost = async (postId, userId) => {
  try {
    const postRef = doc(db, 'masterClasses', postId);
    const postSnap = await getDocs(query(collection(db, 'masterClasses'), where('__name__', '==', postId)));
    
    if (postSnap.docs.length === 0) return false;
    
    const postData = postSnap.docs[0].data();
    const likeKey = `likedBy_${userId}`;
    return postData[likeKey] === true;
  } catch (error) {
    console.error('Erreur lors de la vérification du like du post:', error);
    return false;
  }
};

/**
 * Récupérer les statistiques d'un post (likes, commentaires, vues)
 */
export const getPostStatistics = async (postId) => {
  try {
    const stats = {
      likes: 0,
      comments: 0,
      views: 0,
    };

    // Récupérer le nombre de likes du post
    const postRef = doc(db, 'masterClasses', postId);
    const postSnap = await getDocs(query(collection(db, 'masterClasses'), where('__name__', '==', postId)));
    
    if (postSnap.docs.length > 0) {
      const postData = postSnap.docs[0].data();
      stats.likes = postData.likes || 0;
    }

    // Compter les commentaires du post
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('parentCommentId', '==', null)
    );
    const commentsSnap = await getDocs(commentsQuery);
    stats.comments = commentsSnap.size;

    // Récupérer les vues
    stats.views = await getViewCount(postId);

    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du post:', error);
    return { likes: 0, comments: 0, views: 0 };
  }
};
