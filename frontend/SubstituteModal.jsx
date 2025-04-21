import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import Button from '../components/Button';
import { colors } from '../utils/colors';
import Loader from '../components/Loader';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../utils/fonts';
import { scaleFont } from '../utils/responsive';
import { useTranslation } from 'react-i18next';

const SubstituteModal = ({ modalVisible, setModalVisible, substituteData, handleSubstituteSelection, applySubstitute, name, loading, loading2 }) => {
    const { t } = useTranslation();
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <StatusBar style="light" backgroundColor={colors.shadow_black} translucent />
            <TouchableWithoutFeedback onPress={() => { setModalVisible(false) }}>
                <View style={styles.modalContainer}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {loading2 ? t('updating_steps') : `${t('substitute')} ${name}`}
                        </Text>
                            {loading ? (
                                <Loader size={120} />
                            ) : substituteData.length > 0 ? (
                                <FlatList
                                    data={substituteData}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item, index }) => (
                                        <TouchableOpacity
                                            style={[styles.modalItem, item.isSelected && styles.selectedSubstitute]}
                                            onPress={() => handleSubstituteSelection(index)}
                                        >
                                            <Image source={{ uri: item.image }} style={styles.modalItemImage} />
                                            <Text style={styles.modalItemText}>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            ) : (
                                <Text style={styles.noSubstitutesText}>{t('no_substitutes')}</Text>
                            )}
                            <View style={styles.modalButtons}>
                                <Button
                                    title={`   ${t('cancel')}   `}
                                    color={colors.light_pink}
                                    fontColor={colors.primary}
                                    onPress={() => { setModalVisible(false) }}
                                />
                                <Button
                                    title={`   ${t('apply')}   `}
                                    onPress={() => {
                                        applySubstitute();
                                    }}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: colors.shadow_black,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.light_background,
        borderTopRightRadius: 25,
        borderTopLeftRadius: 25,
        padding: 15,
        maxHeight: '70%',
        minHeight: '40%',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: scaleFont(fonts.xxl_22),
        fontWeight: 'bold',
        marginBottom: 15,
        alignSelf: 'center',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
        padding: 10,
        borderRadius: 15,
    },
    modalItemImage: {
        width: 80,
        height: 80,
        marginRight: 20,
        borderRadius: 15,
    },
    selectedSubstitute: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    modalItemText: {
        fontSize: scaleFont(fonts.l_17),
        fontWeight: '400',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingBottom: 20,
    },
    noSubstitutesText: {
        fontSize: scaleFont(fonts.m_16),
        textAlign: 'center',
        marginVertical: 20,
        color: colors.grey,
    },
});

export default SubstituteModal;
