import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col items-center gap-3 p-6 bg-white border-t border-slate-100">
            <div className="flex items-center gap-1.5">
                <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors text-slate-600 shadow-sm"><ChevronLeft size={16} /></button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                            <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors text-slate-600 shadow-sm rotate-180"><ChevronLeft size={16} /></button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                Página {currentPage} de {totalPages} ({totalItems} resultados)
            </p>
        </div>
    );
};