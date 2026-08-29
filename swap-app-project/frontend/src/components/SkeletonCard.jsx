import React from 'react';

export const SkeletonPostCard = () => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full animate-pulse">
      {/* Imagen Placeholder */}
      <div className="aspect-[4/3] bg-slate-200" />

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Autor */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
            <div className="h-3 bg-slate-200 rounded-lg w-24" />
          </div>

          <div className="h-5 bg-slate-200 rounded-xl w-4/5 mb-2.5" />
          <div className="h-3 bg-slate-100 rounded-lg w-full mb-1.5" />
          <div className="h-3 bg-slate-100 rounded-lg w-3/5 mb-4" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 gap-2">
          <div className="w-16 h-8 bg-slate-100 rounded-xl" />
          <div className="flex-1 h-8 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonExchangeCard = () => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 animate-pulse">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-6 flex-1 justify-center lg:justify-start">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-200 rounded-3xl" />
          <div className="w-10 h-10 bg-slate-100 rounded-full" />
          <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-200 rounded-3xl" />
        </div>
        <div className="flex-1 w-full flex flex-col items-center gap-4">
          <div className="w-24 h-6 bg-slate-200 rounded-full" />
          <div className="w-48 h-5 bg-slate-200 rounded-xl" />
          <div className="w-36 h-10 bg-slate-200 rounded-2xl mt-2" />
        </div>
      </div>
    </div>
  );
};
