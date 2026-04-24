import { Ionicons } from '@expo/vector-icons';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    where
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { db } from '../../../services/firebase/firebaseConfig';
import Header from '../../components/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { addView, updateCommentLikes, checkIfUserLiked } from '../../../services/firebase/commentServices';

const CommentsScreen = ({ route, navigation }) => {
    const { postId, title, masteclassId, postAuthorId } = route.params || {};
    // postAuthorId : UID de l'auteur du post, à passer depuis l'écran précédent

    const [comments, setComments]               = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [newComment, setNewComment]           = useState('');
    const [submitting, setSubmitting]           = useState(false);
    const [expandedReplies, setExpandedReplies] = useState(new Set());
    const [stats, setStats]                     = useState({ comments: 0, likes: 0, views: 0 });
    const [userLikes, setUserLikes]             = useState({});

    // Gestion de la réponse en cours
    const [replyingTo, setReplyingTo] = useState(null);
    // { commentId, author } ou null

    const inputRef = useRef(null);
    const { user } = useAuth();

    const itemId         = postId || masteclassId;
    const isPostAuthor   = user?.uid && user.uid === postAuthorId;

    // ── Chargement ────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchComments();
        recordView();
    }, [itemId]);

    const recordView = async () => {
        try { if (itemId) await addView(itemId); } catch (e) { console.error(e); }
    };

    const fetchComments = async () => {
        try {
            setLoading(true);
            if (!itemId) { setLoading(false); return; }

            const q = query(
                collection(db, 'comments'),
                where('postId', '==', itemId),
                where('parentCommentId', '==', null),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);

            let totalLikes = 0;
            const newUserLikes = {};
            const commentsData = [];

            for (const docSnap of snap.docs) {
                const data      = docSnap.data();
                const commentId = docSnap.id;
                const userLiked = user?.uid ? await checkIfUserLiked(commentId, user.uid) : false;
                newUserLikes[commentId] = userLiked;
                totalLikes += data.likes || 0;

                // Réponses
                const repliesSnap = await getDocs(query(
                    collection(db, 'comments'),
                    where('parentCommentId', '==', commentId),
                    orderBy('createdAt', 'asc')
                ));
                const replies = repliesSnap.docs.map(r => ({
                    id: r.id,
                    ...r.data(),
                    createdAt: r.data().createdAt?.toDate?.() || new Date(r.data().createdAt),
                }));

                commentsData.push({
                    id: commentId,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
                    isLiked: userLiked,
                    replies,
                });
            }

            setComments(commentsData);
            setUserLikes(newUserLikes);
            setStats({ comments: commentsData.length, likes: totalLikes, views: 0 });
        } catch (e) {
            console.error('Erreur chargement commentaires :', e);
        } finally {
            setLoading(false);
        }
    };

    // ── Ajouter commentaire ou réponse ────────────────────────────────────────
    const addComment = async () => {
        if (!newComment.trim()) return;
        try {
            setSubmitting(true);
            const isReply = replyingTo !== null;

            const data = {
                postId:          itemId,
                parentCommentId: isReply ? replyingTo.commentId : null,
                text:            newComment.trim(),
                author:          user?.nom || 'Anonyme',
                authorId:        user?.uid || null,
                authorAvatar:    user?.photo || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                createdAt:       Timestamp.now(),
                likes:           0,
            };

            const ref = await addDoc(collection(db, 'comments'), data);
            const newEntry = { id: ref.id, ...data, createdAt: new Date(), isLiked: false, replies: [] };

            if (isReply) {
                // Injecter la réponse dans le commentaire parent
                setComments(prev => prev.map(c =>
                    c.id === replyingTo.commentId
                        ? { ...c, replies: [...c.replies, newEntry] }
                        : c
                ));
                // Auto-expand
                setExpandedReplies(prev => new Set([...prev, replyingTo.commentId]));
            } else {
                setComments(prev => [newEntry, ...prev]);
                setStats(prev => ({ ...prev, comments: prev.comments + 1 }));
            }

            setNewComment('');
            setReplyingTo(null);
        } catch (e) {
            console.error('Erreur ajout commentaire :', e);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Supprimer ─────────────────────────────────────────────────────────────
    // Seuls autorisés : auteur du post OU auteur du commentaire
    const canDeleteComment = (comment) => {
        if (!user?.uid) return false;
        return isPostAuthor || user.uid === comment.authorId;
    };

    const canDeleteReply = (reply) => {
        if (!user?.uid) return false;
        return isPostAuthor || user.uid === reply.authorId;
    };

    const confirmDelete = (onConfirm) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous vraiment supprimer ce commentaire ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
            ]
        );
    };

    const deleteComment = (commentId) => {
        confirmDelete(async () => {
            try {
                await deleteDoc(doc(db, 'comments', commentId));
                setComments(prev => prev.filter(c => c.id !== commentId));
                setStats(prev => ({ ...prev, comments: prev.comments - 1 }));
            } catch (e) { console.error(e); }
        });
    };

    const deleteReply = (parentId, replyId) => {
        confirmDelete(async () => {
            try {
                await deleteDoc(doc(db, 'comments', replyId));
                setComments(prev => prev.map(c =>
                    c.id === parentId
                        ? { ...c, replies: c.replies.filter(r => r.id !== replyId) }
                        : c
                ));
            } catch (e) { console.error(e); }
        });
    };

    // ── Like ──────────────────────────────────────────────────────────────────
    const toggleLikeComment = async (commentId) => {
        try {
            const comment = comments.find(c => c.id === commentId);
            if (!comment || !user?.uid) return;
            const isLiked    = userLikes[commentId];
            const newCount   = isLiked ? comment.likes - 1 : comment.likes + 1;
            await updateCommentLikes(commentId, user.uid, !isLiked);
            setUserLikes(prev => ({ ...prev, [commentId]: !isLiked }));
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, likes: newCount, isLiked: !isLiked } : c
            ));
            setStats(prev => ({ ...prev, likes: prev.likes + (isLiked ? -1 : 1) }));
        } catch (e) { console.error(e); }
    };

    // ── Répondre ──────────────────────────────────────────────────────────────
    const startReply = (commentId, author) => {
        setReplyingTo({ commentId, author });
        setNewComment('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setNewComment('');
    };

    // ── Expand replies ────────────────────────────────────────────────────────
    const toggleExpandReplies = (commentId) => {
        setExpandedReplies(prev => {
            const next = new Set(prev);
            next.has(commentId) ? next.delete(commentId) : next.add(commentId);
            return next;
        });
    };

    // ── Formatage date ────────────────────────────────────────────────────────
    const formatTime = (date) => {
        if (!date) return '';
        const diff = Date.now() - date;
        const m = Math.floor(diff / 60000);
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        if (m < 1)  return 'À l\'instant';
        if (m < 60) return `${m}m`;
        if (h < 24) return `${h}h`;
        if (d < 7)  return `${d}j`;
        return date.toLocaleDateString('fr-FR');
    };

    // ── Render commentaire ────────────────────────────────────────────────────
    const renderComment = ({ item }) => {
        const isExpanded = expandedReplies.has(item.id);
        const showDelete = canDeleteComment(item);

        return (
            <View style={styles.commentWrapper}>
                {/* Commentaire principal */}
                <View style={styles.commentContainer}>
                    <Image source={{ uri: item.authorAvatar }} style={styles.commentAvatar} />

                    <View style={styles.commentContent}>
                        {/* En-tête */}
                        <View style={styles.commentHeader}>
                            <View>
                                <Text style={styles.commentAuthor}>{item.author}</Text>
                                <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>
                            </View>
                            {/* Bouton supprimer — visible seulement si autorisé */}
                            {showDelete && (
                                <Pressable
                                    style={styles.deleteButton}
                                    onPress={() => deleteComment(item.id)}
                                    hitSlop={8}
                                >
                                    <Ionicons name="trash-outline" size={wp('4%')} color="#FF6B6B" />
                                </Pressable>
                            )}
                        </View>

                        {/* Texte */}
                        <Text style={styles.commentText}>{item.text}</Text>

                        {/* Actions */}
                        <View style={styles.commentActions}>
                            <Pressable
                                style={[styles.actionBtn, item.isLiked && styles.actionBtnLiked]}
                                onPress={() => toggleLikeComment(item.id)}
                            >
                                <Ionicons
                                    name={item.isLiked ? 'heart' : 'heart-outline'}
                                    size={wp('4%')}
                                    color={item.isLiked ? '#FF6B6B' : '#999'}
                                />
                                <Text style={[styles.actionText, item.isLiked && styles.actionTextLiked]}>
                                    {item.likes}
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.actionBtn, replyingTo?.commentId === item.id && styles.actionBtnReply]}
                                onPress={() => startReply(item.id, item.author)}
                            >
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={wp('4%')}
                                    color={replyingTo?.commentId === item.id ? '#7B68EE' : '#999'}
                                />
                                <Text style={[styles.actionText, replyingTo?.commentId === item.id && styles.actionTextReply]}>
                                    Répondre
                                </Text>
                            </Pressable>
                        </View>

                        {/* Toggle réponses */}
                        {item.replies?.length > 0 && (
                            <Pressable style={styles.toggleReplies} onPress={() => toggleExpandReplies(item.id)}>
                                <View style={styles.toggleRepliesLine} />
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={wp('3.5%')}
                                    color="#7B68EE"
                                />
                                <Text style={styles.toggleRepliesText}>
                                    {isExpanded ? 'Masquer' : `${item.replies.length} réponse${item.replies.length > 1 ? 's' : ''}`}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Réponses */}
                {isExpanded && item.replies?.length > 0 && (
                    <View style={styles.repliesBlock}>
                        {item.replies.map(reply => (
                            <View key={reply.id} style={styles.replyRow}>
                                {/* Trait de connexion */}
                                <View style={styles.replyConnector}>
                                    <View style={styles.replyConnectorLine} />
                                </View>

                                <Image source={{ uri: reply.authorAvatar }} style={styles.replyAvatar} />

                                <View style={styles.replyContent}>
                                    <View style={styles.replyHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.replyAuthor}>{reply.author}</Text>
                                            <Text style={styles.replyTime}>{formatTime(reply.createdAt)}</Text>
                                        </View>
                                        {canDeleteReply(reply) && (
                                            <Pressable
                                                style={styles.deleteButton}
                                                onPress={() => deleteReply(item.id, reply.id)}
                                                hitSlop={8}
                                            >
                                                <Ionicons name="trash-outline" size={wp('3.5%')} color="#FF6B6B" />
                                            </Pressable>
                                        )}
                                    </View>
                                    <Text style={styles.replyText}>{reply.text}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    // ── Rendu ─────────────────────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Header
                pageName={title || 'Commentaires'}
                onProfilePress={() => navigation.navigate('Profile')}
                onNotificationPress={() => navigation.navigate('Notifications')}
                notificationCount={0}
            />

            {/* Stats */}
            <View style={styles.statsBar}>
                <StatItem icon="chatbubble-outline" color="#7B68EE" label="Commentaires" value={stats.comments} />
                <View style={styles.statDiv} />
                <StatItem icon="heart-outline"      color="#FF6B6B" label="Likes"         value={stats.likes} />
                <View style={styles.statDiv} />
                <StatItem icon="eye-outline"        color="#4CAF50" label="Vues"          value={stats.views} />
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#7B68EE" />
                </View>
            ) : (
                <FlatList
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Ionicons name="chatbubbles-outline" size={wp('15%')} color="#E0E0E0" />
                            <Text style={styles.emptyTitle}>Aucun commentaire</Text>
                            <Text style={styles.emptySub}>Soyez le premier à commenter</Text>
                        </View>
                    }
                />
            )}

            {/* Barre de saisie */}
            <View style={styles.inputWrapper}>
                {/* Bandeau "En réponse à" */}
                {replyingTo && (
                    <View style={styles.replyBanner}>
                        <Ionicons name="return-down-forward-outline" size={14} color="#7B68EE" />
                        <Text style={styles.replyBannerText}>
                            Réponse à <Text style={styles.replyBannerAuthor}>{replyingTo.author}</Text>
                        </Text>
                        <Pressable onPress={cancelReply} hitSlop={8}>
                            <Ionicons name="close-circle" size={16} color="#999" />
                        </Pressable>
                    </View>
                )}

                <View style={styles.inputRow}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder={replyingTo ? `Répondre à ${replyingTo.author}…` : 'Ajouter un commentaire…'}
                        placeholderTextColor="#999"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                        maxLength={500}
                        editable={!submitting}
                    />
                    <Pressable
                        style={[styles.sendBtn, (!newComment.trim() || submitting) && styles.sendBtnDisabled]}
                        onPress={addComment}
                        disabled={!newComment.trim() || submitting}
                    >
                        {submitting
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="send" size={wp('5%')} color="#fff" />
                        }
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

// ─── Sous-composant stat ──────────────────────────────────────────────────────
const StatItem = ({ icon, color, label, value }) => (
    <View style={styles.statItem}>
        <Ionicons name={icon} size={wp('5%')} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#F8F9FA', marginTop: Platform.OS === 'android' ? hp('4%') : 5 },

    // Stats bar
    statsBar:    { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: wp('3%'), paddingVertical: hp('1.5%'), alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
    statItem:    { flex: 1, alignItems: 'center' },
    statDiv:     { width: 1, height: hp('4%'), backgroundColor: '#E0E0E0' },
    statLabel:   { fontSize: wp('2.8%'), color: '#666', fontWeight: '500', marginTop: hp('0.3%') },
    statValue:   { fontSize: wp('4%'), color: '#1A1A1A', fontWeight: '700', marginTop: hp('0.2%') },

    loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list:        { paddingHorizontal: wp('3%'), paddingTop: hp('1.5%'), paddingBottom: hp('2%') },

    // Commentaire
    commentWrapper: { marginBottom: hp('1.5%') },
    commentContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: wp('3%'), elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
    commentAvatar:  { width: wp('10%'), height: wp('10%'), borderRadius: wp('5%'), backgroundColor: '#E0E0E0', marginRight: wp('3%') },
    commentContent: { flex: 1 },
    commentHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hp('0.5%') },
    commentAuthor:  { fontSize: wp('3.8%'), fontWeight: '700', color: '#1A1A1A' },
    commentTime:    { fontSize: wp('2.8%'), color: '#999', marginTop: hp('0.2%') },
    commentText:    { fontSize: wp('3.5%'), color: '#333', lineHeight: wp('5%'), marginBottom: hp('1%') },

    // Actions
    commentActions: { flexDirection: 'row', alignItems: 'center', gap: wp('2%') },
    actionBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('2.5%'), paddingVertical: hp('0.6%'), borderRadius: 20, backgroundColor: '#F5F5F5', gap: wp('1%') },
    actionBtnLiked: { backgroundColor: '#FFE8E8' },
    actionBtnReply: { backgroundColor: '#EEF0FF' },
    actionText:     { fontSize: wp('3%'), color: '#999', fontWeight: '500' },
    actionTextLiked:{ color: '#FF6B6B' },
    actionTextReply:{ color: '#7B68EE' },

    // Bouton supprimer (positionné en haut à droite)
    deleteButton:   { padding: 4 },

    // Toggle réponses
    toggleReplies:     { flexDirection: 'row', alignItems: 'center', marginTop: hp('1%'), gap: 5 },
    toggleRepliesLine: { flex: 0, width: 20, height: 1, backgroundColor: '#E0E0E0' },
    toggleRepliesText: { fontSize: wp('3.2%'), color: '#7B68EE', fontWeight: '600' },

    // Réponses
    repliesBlock:      { marginTop: 2, paddingLeft: wp('13%') },
    replyRow:          { flexDirection: 'row', marginBottom: hp('1%'), alignItems: 'flex-start' },
    replyConnector:    { width: wp('4%'), alignItems: 'center', paddingTop: wp('3%') },
    replyConnectorLine:{ width: 2, flex: 1, backgroundColor: '#E8E3F5', borderRadius: 2 },
    replyAvatar:       { width: wp('7.5%'), height: wp('7.5%'), borderRadius: wp('4%'), backgroundColor: '#E0E0E0', marginRight: wp('2%') },
    replyContent:      { flex: 1, backgroundColor: '#F5F3FF', borderRadius: 10, padding: wp('2.5%') },
    replyHeader:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: hp('0.3%') },
    replyAuthor:       { fontSize: wp('3.3%'), fontWeight: '700', color: '#1A1A1A' },
    replyTime:         { fontSize: wp('2.6%'), color: '#999' },
    replyText:         { fontSize: wp('3.2%'), color: '#333', lineHeight: wp('4.5%') },

    // Barre input
    inputWrapper:   { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingHorizontal: wp('3%'), paddingTop: hp('1%'), paddingBottom: hp('1.5%') },
    replyBanner:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0EEFF', borderRadius: 8, paddingHorizontal: wp('3%'), paddingVertical: hp('0.8%'), marginBottom: hp('0.8%'), gap: 6 },
    replyBannerText:{ flex: 1, fontSize: wp('3%'), color: '#555' },
    replyBannerAuthor: { fontWeight: '700', color: '#7B68EE' },
    inputRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: wp('2%') },
    input:          { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: wp('4%'), paddingVertical: hp('1.2%'), fontSize: wp('3.5%'), color: '#333', maxHeight: hp('15%') },
    sendBtn:        { backgroundColor: '#7B68EE', width: wp('10%'), height: wp('10%'), borderRadius: wp('5%'), justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#7B68EE', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    sendBtnDisabled:{ backgroundColor: '#CCC', elevation: 0, shadowOpacity: 0 },

    // Empty
    emptyBox:   { alignItems: 'center', paddingVertical: hp('8%'), paddingHorizontal: wp('8%') },
    emptyTitle: { fontSize: wp('5%'), fontWeight: '600', color: '#666', marginTop: hp('2%'), marginBottom: hp('1%') },
    emptySub:   { fontSize: wp('3.8%'), color: '#999', textAlign: 'center' },
});

export default CommentsScreen;