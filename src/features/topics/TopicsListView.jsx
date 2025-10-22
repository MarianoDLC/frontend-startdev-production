import React, { useState, useEffect } from 'react';
import { BookOpen, Edit, Trash2, Loader, X, FileText, Link, Code, Plus, Upload, CheckCircle, Save } from 'lucide-react';
import ErrorModal from "../../modal/ErrorModal";
import EditTopicModal from '../topics/EditTopicModal';
import SuccessModal from "../../modal/SuccessModal";
const API_URL = import.meta.env.VITE_API_URL;

const TopicsListView = () => {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name_topic: '',
    description: '',
    objectives: ''
  });

  const [resources, setResources] = useState([
    { id: 1, title_resource: '', url_resource: '', description_resource: '', type_resource: [] }
  ]);

  const [examples, setExamples] = useState([
    { id: 1, title_example: '', code_snipped: '', explanation: '' }
  ]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/topics`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los temas');
      }

      const result = await response.json();
      setTopics(result.data);
    } catch (err) {
      setError(err.message);
      setIsErrorOpen(true);
      console.error('❌ Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicUpdated = () => {
    fetchTopics();
  };

  const extractTextFromRichText = (richTextArray) => {
    if (!richTextArray || !Array.isArray(richTextArray)) return '';
    
    return richTextArray
      .map(block => {
        if (block.children && Array.isArray(block.children)) {
          return block.children
            .map(child => child.text || '')
            .join('');
        }
        return '';
      })
      .join(' ');
  };

  const handleEditClick = (topicId) => {
    setSelectedTopicId(topicId);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTopicId(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="text-purple-600 animate-spin mb-4" size={48} />
          <p className="text-gray-600 font-medium">Cargando temas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">Error: {error}</p>
          </div>
        </div>
        <ErrorModal
          isOpen={isErrorOpen}
          onClose={() => {
            setIsErrorOpen(false);
            setError(null);
          }}
          message={error}
        />
      </>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="text-white" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-black">Temas de Aprendizaje</h2>
            <p className="text-gray-600">
              {topics.length} {topics.length === 1 ? 'tema disponible' : 'temas disponibles'}
            </p>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      {topics.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 font-medium text-lg">No hay temas disponibles</p>
          <p className="text-gray-400 text-sm mt-2">Crea tu primer tema para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => {
            const description = extractTextFromRichText(topic.description);
            const gradients = [
              'from-violet-500 via-purple-500 to-fuchsia-500',
              'from-purple-500 via-violet-500 to-indigo-500',
              'from-fuchsia-500 via-purple-500 to-pink-500',
            ];
            const gradient = gradients[index % gradients.length];
            
            return (
              <div
                key={topic.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-[400px]"
              >
                {/* Gradient top bar */}
                <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                
                {/* Card Header with Icon */}
                <div className="p-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md`}>
                    <BookOpen className="text-white" size={28} />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {topic.name_topic}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-5">
                    {description}
                  </p>
                </div>

                {/* Spacer to push buttons to bottom */}
                <div className="flex-1"></div>

                {/* Action Buttons */}
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleEditClick(topic.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${gradient} text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md`}
                  >
                    <Edit size={18} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Topic Modal */}
      <EditTopicModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        topicId={selectedTopicId}
        onSuccess={handleTopicUpdated}
      />
    </div>
  );
};

export default TopicsListView;